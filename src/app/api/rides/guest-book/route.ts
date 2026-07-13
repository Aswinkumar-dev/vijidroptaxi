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
    if (
      !full_name ||
      !phone ||
      !ride_type ||
      !pickup_address ||
      !drop_address ||
      !scheduled_at ||
      !car_type ||
      !distance_km ||
      !payment_mode
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Clean and format phone number (e.g. 10 digits to +91XXXXXXXXXX)
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      return NextResponse.json({ error: 'Phone number must be exactly 10 digits' }, { status: 400 });
    }
    const formattedPhone = '+91' + digitsOnly;

    // Standardized guest credentials
    const guestEmail = `${digitsOnly}@vijidroptaxi.com`;
    const guestPassword = `viji_${digitsOnly}`;

    let customerId: string;

    // Check if profile exists with this phone number
    const { data: existingProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking profile:', profileError);
      return NextResponse.json({ error: 'Database check failed' }, { status: 500 });
    }

    if (existingProfile) {
      if (existingProfile.role !== 'customer') {
        return NextResponse.json({ error: 'This phone number belongs to a driver or admin account.' }, { status: 400 });
      }
      customerId = existingProfile.id;

      // Update their password in auth so we can guarantee successful client-side log in
      const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(customerId, {
        password: guestPassword,
      });

      if (updateAuthError) {
        console.error('Error updating existing guest password in auth:', updateAuthError);
        // We will proceed even if auth update fails, but log it
      }
    } else {
      // Create new auth user
      const { data: newAuthUser, error: createAuthError } = await adminClient.auth.admin.createUser({
        email: guestEmail,
        password: guestPassword,
        email_confirm: true,
      });

      if (createAuthError || !newAuthUser.user) {
        console.error('Error creating auth user:', createAuthError);
        return NextResponse.json({ error: createAuthError?.message || 'Failed to create account.' }, { status: 500 });
      }

      customerId = newAuthUser.user.id;

      // Insert profile record
      const { error: insertProfileError } = await adminClient
        .from('profiles')
        .insert({
          id: customerId,
          full_name: full_name.trim(),
          phone: formattedPhone,
          role: 'customer',
        });

      if (insertProfileError) {
        console.error('Error inserting profile:', insertProfileError);
        return NextResponse.json({ error: 'Failed to create customer profile.' }, { status: 500 });
      }
    }

    // Fetch fare rule to compute the fare (consistent with the regular booking API)
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
      // Fallbacks
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

    const notesStr = return_scheduled_at 
      ? `Return Trip: ${new Date(return_scheduled_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })} ${new Date(return_scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
      : null;

    // Create the ride booking
    const { data: ride, error: rideError } = await adminClient
      .from('rides')
      .insert({
        customer_id: customerId,
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
        car_type,
        notes: notesStr,
      })
      .select()
      .single();

    if (rideError) {
      console.error('Error creating ride:', rideError);
      return NextResponse.json({ error: rideError.message }, { status: 500 });
    }

    // Create status history log
    await adminClient.from('ride_status_history').insert({
      ride_id: ride.id,
      status: 'pending',
      changed_by: customerId,
    });

    return NextResponse.json(
      {
        id: ride.id,
        email: guestEmail,
        password: guestPassword,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Server error during guest booking:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
