import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const adminClient = createAdminClient();

    const body = await req.json();
    const {
      full_name,
      phone,
      ride_type,
      pickup_address,
      drop_address,
      scheduled_at,
      return_scheduled_at,
      car_type,
      distance_km,
      payment_mode,
    } = body;

    // Validation
    if (!full_name || !phone || !ride_type || !pickup_address || !drop_address || !scheduled_at || !car_type || !distance_km || !payment_mode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Clean phone number
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      return NextResponse.json({ error: 'Phone number must be exactly 10 digits' }, { status: 400 });
    }
    const formattedPhone = '+91' + digitsOnly;

    // Fetch fare rule
    const { data: fareRule } = await adminClient
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
      if (car_type === 'innova') {
        base_fare = 180;
        per_km_rate = ride_type === 'one_way' ? 21 : 20;
        if (ride_type === 'round_trip') driver_allowance = 350;
      } else if (car_type === 'suv') {
        base_fare = 150;
        per_km_rate = ride_type === 'one_way' ? 20 : 19;
        if (ride_type === 'round_trip') driver_allowance = 300;
      } else {
        base_fare = 100;
        per_km_rate = ride_type === 'one_way' ? 15 : 14;
        if (ride_type === 'round_trip') driver_allowance = 250;
      }
    }

    const calculated_distance = ride_type === 'one_way' 
      ? Math.max(Number(distance_km), 130) 
      : Math.max(Number(distance_km) * 2, 250);
    const total_fare = base_fare + (calculated_distance * per_km_rate) + driver_allowance;

    const notesStr = return_scheduled_at
      ? `Return Trip: ${new Date(return_scheduled_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })} ${new Date(return_scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
      : null;

    // Insert ride directly — no auth, no profile creation
    const { data: ride, error: rideError } = await adminClient
      .from('rides')
      .insert({
        customer_name: full_name.trim(),
        customer_phone: formattedPhone,
        ride_type,
        pickup_address,
        drop_address,
        scheduled_at,
        car_type,
        distance_km: calculated_distance,
        total_fare,
        payment_mode,
        status: 'pending',
        notes: notesStr,
      })
      .select()
      .single();

    if (rideError || !ride) {
      console.error('Error creating ride:', rideError);
      return NextResponse.json({ error: rideError?.message || 'Failed to create booking.' }, { status: 500 });
    }

    return NextResponse.json({ id: ride.id, message: 'Booking created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Server error during guest booking:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
