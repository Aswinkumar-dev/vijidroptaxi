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

export async function POST(req: NextRequest) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
    }

    const {
      customer_name,
      customer_phone,
      ride_type,
      pickup_address,
      drop_address,
      scheduled_at,
      car_type,
      distance_km,
      total_fare,
      payment_mode,
    } = await req.json();

    if (!customer_phone || !pickup_address || !drop_address || !scheduled_at || !car_type || !total_fare) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data: ride, error } = await adminSupabase
      .from('rides')
      .insert({
        customer_name: customer_name ? customer_name.trim() : 'Guest',
        customer_phone,
        ride_type,
        pickup_address,
        drop_address,
        scheduled_at,
        car_type,
        distance_km: Number(distance_km) || 0,
        total_fare: Number(total_fare),
        payment_mode: payment_mode || 'cash',
        status: 'pending',
        payment_status: 'unpaid',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating manual booking:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Ride created successfully', ride }, { status: 201 });
  } catch (error: any) {
    console.error('Server error creating manual booking:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : null;

    const adminSupabase = createAdminClient();
    let query = adminSupabase
      .from('rides')
      .select(`
        *,
        customer:profiles!rides_customer_id_fkey(id, full_name, phone),
        driver:drivers(
          id,
          profile:profiles(id, full_name, phone)
        ),
        car:cars(*)
      `)
      .order('scheduled_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data: rides, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(rides || []);
  } catch (error: any) {
    console.error('Server error fetching bookings:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
