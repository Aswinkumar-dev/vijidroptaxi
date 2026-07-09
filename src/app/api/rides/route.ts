import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticating user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'customer') {
      return NextResponse.json({ error: 'Only customers can book rides' }, { status: 403 });
    }

    const body = await req.json();
    const {
      ride_type,
      pickup_address,
      drop_address,
      scheduled_at,
      car_type,
      distance_km,
      payment_mode,
    } = body;

    if (!ride_type || !pickup_address || !drop_address || !scheduled_at || !car_type || !distance_km || !payment_mode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch fare rule
    const { data: fareRule, error: fareError } = await supabase
      .from('fare_rules')
      .select('*')
      .eq('car_type', car_type)
      .eq('ride_type', ride_type)
      .order('applicable_from', { ascending: false })
      .limit(1)
      .maybeSingle();

    let base_fare = 100;
    let per_km_rate = 15;
    let driver_allowance = 0;

    if (fareRule) {
      base_fare = Number(fareRule.base_fare);
      per_km_rate = Number(fareRule.per_km_rate);
      driver_allowance = Number(fareRule.driver_allowance || 0);
    } else {
      // Fallbacks based on typical configuration
      if (car_type === 'hatchback') {
        base_fare = 80;
        per_km_rate = 12;
      } else if (car_type === 'suv') {
        base_fare = 150;
        per_km_rate = 20;
        if (ride_type === 'round_trip') driver_allowance = 300;
      } else {
        base_fare = 100;
        per_km_rate = 15;
        if (ride_type === 'round_trip') driver_allowance = 250;
      }
    }

    const calculated_distance = Number(distance_km);
    const total_fare = base_fare + (calculated_distance * per_km_rate) + driver_allowance;

    // Create the ride booking
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .insert({
        customer_id: user.id,
        ride_type,
        pickup_address,
        drop_address,
        scheduled_at,
        status: 'pending',
        distance_km: calculated_distance,
        base_fare,
        total_fare,
        payment_mode,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (rideError) {
      console.error('Error creating ride:', rideError);
      return NextResponse.json({ error: rideError.message }, { status: 500 });
    }

    // Create status history log
    await supabase.from('ride_status_history').insert({
      ride_id: ride.id,
      status: 'pending',
      changed_by: user.id,
    });

    return NextResponse.json(ride, { status: 201 });
  } catch (error: any) {
    console.error('Server error booking ride:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
