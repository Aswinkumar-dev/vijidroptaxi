import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabaseServer';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') return null;
  return user.id;
}

export async function GET(req: NextRequest) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();

    // Query stats using adminSupabase to bypass RLS
    const { count: totalRidesCount } = await adminSupabase.from('rides').select('*', { count: 'exact', head: true });
    const { count: pendingCount } = await adminSupabase.from('rides').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: activeCount } = await adminSupabase.from('rides').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'driver_arrived', 'ongoing']);
    const { count: completedCount } = await adminSupabase.from('rides').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    
    const { count: driversCount } = await adminSupabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_active', true);
    const { count: carsCount } = await adminSupabase.from('cars').select('*', { count: 'exact', head: true }).eq('is_active', true);

    // Fetch driver ratings avg
    const { data: driverRatings } = await adminSupabase.from('drivers').select('rating_avg');
    let ratingAvg = 5.0;
    if (driverRatings && driverRatings.length > 0) {
      const sum = driverRatings.reduce((acc, curr) => acc + Number(curr.rating_avg || 0), 0);
      ratingAvg = parseFloat((sum / driverRatings.length).toFixed(1));
    }

    return NextResponse.json({
      totalRides: totalRidesCount || 0,
      pendingRides: pendingCount || 0,
      activeRides: activeCount || 0,
      completedRides: completedCount || 0,
      totalDrivers: driversCount || 0,
      totalCars: carsCount || 0,
      avgRating: ratingAvg
    });
  } catch (error: any) {
    console.error('Server error fetching admin stats:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
