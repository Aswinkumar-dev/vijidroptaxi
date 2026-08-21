import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabaseServer';
import { getCache, setCache } from '@/lib/apiCache';

const CACHE_KEY = 'admin:stats';
const CACHE_TTL = 15_000; // 15 seconds

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

    // Serve from cache if fresh
    const cached = getCache<object>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=30' },
      });
    }

    const adminSupabase = createAdminClient();

    // Run all count queries in parallel — saves ~1.5s vs sequential
    const [
      { count: totalRidesCount },
      { count: pendingCount },
      { count: activeCount },
      { count: completedCount },
      { count: driversCount },
      { count: carsCount },
      { data: driverRatings },
    ] = await Promise.all([
      adminSupabase.from('rides').select('*', { count: 'exact', head: true }),
      adminSupabase.from('rides').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      adminSupabase.from('rides').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'driver_arrived', 'ongoing']),
      adminSupabase.from('rides').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      adminSupabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_active', true),
      adminSupabase.from('cars').select('*', { count: 'exact', head: true }).eq('is_active', true),
      adminSupabase.from('drivers').select('rating_avg'),
    ]);

    let ratingAvg = 5.0;
    if (driverRatings && driverRatings.length > 0) {
      const sum = driverRatings.reduce((acc, curr) => acc + Number(curr.rating_avg || 0), 0);
      ratingAvg = parseFloat((sum / driverRatings.length).toFixed(1));
    }

    const result = {
      totalRides: totalRidesCount || 0,
      pendingRides: pendingCount || 0,
      activeRides: activeCount || 0,
      completedRides: completedCount || 0,
      totalDrivers: driversCount || 0,
      totalCars: carsCount || 0,
      avgRating: ratingAvg,
    };

    setCache(CACHE_KEY, result, CACHE_TTL);

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=30' },
    });
  } catch (error: any) {
    console.error('Server error fetching admin stats:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
