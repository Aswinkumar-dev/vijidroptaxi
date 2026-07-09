import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'driver') {
      return NextResponse.json({ error: 'Forbidden: Drivers only' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();

    // Get driver record
    const { data: driver, error: driverError } = await adminSupabase
      .from('drivers')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (driverError || !driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    // Fetch active rides for this driver (status in confirmed, driver_arrived, ongoing)
    const { data: rides, error: ridesError } = await adminSupabase
      .from('rides')
      .select(`
        *,
        customer:profiles!rides_customer_id_fkey(id, full_name, phone),
        car:cars(*)
      `)
      .eq('driver_id', driver.id)
      .in('status', ['confirmed', 'driver_arrived', 'ongoing'])
      .order('scheduled_at', { ascending: true });

    if (ridesError) {
      console.error('Error fetching driver rides:', ridesError);
      return NextResponse.json({ error: ridesError.message }, { status: 500 });
    }

    // Remove OTP from the active rides list for security (the driver shouldn't see it until verified, and wait, they enter guess to /verify-otp so client shouldn't see it).
    const sanitizedRides = rides.map(ride => {
      const sanitized = { ...ride };
      delete sanitized.otp;
      return sanitized;
    });

    return NextResponse.json(sanitizedRides);
  } catch (error: any) {
    console.error('Server error fetching driver rides:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
