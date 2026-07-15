import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabaseServer';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rideId } = await params;
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client (bypasses RLS) to query requester profile and ride details
    const adminSupabase = createAdminClient();

    // Get requester profile
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const { data: ride, error: rideError } = await adminSupabase
      .from('rides')
      .select(`
        *,
        customer:profiles!rides_customer_id_fkey(id, full_name, phone),
        driver:drivers(
          id,
          license_number,
          rating_avg,
          profile:profiles(id, full_name, phone)
        ),
        car:cars(*)
      `)
      .eq('id', rideId)
      .single();

    if (rideError || !ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    const isCustomer = ride.customer_id === user.id;
    let isDriver = false;

    // Check if the user is the assigned driver
    if (profile.role === 'driver') {
      const { data: driverData } = await adminSupabase
        .from('drivers')
        .select('id')
        .eq('profile_id', user.id)
        .single();
      
      if (driverData && ride.driver_id === driverData.id) {
        isDriver = true;
      }
    }

    const isAdmin = profile.role === 'admin';

    // Access check: only customer, driver, or admin can access
    if (!isCustomer && !isDriver && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Clone ride object to strip OTP based on roles
    const sanitizedRide = { ...ride };

    // OTP Visibility Rules:
    // - Admin: always sees OTP
    // - Customer: only sees OTP when status is 'driver_arrived' (or ongoing/completed for history)
    // - Driver: NEVER sees OTP from GET request (driver client should only submit OTP guess)
    const statusAllowsOtp = ['driver_arrived', 'ongoing', 'completed'].includes(ride.status);
    if (isAdmin) {
      // Expose OTP
    } else if (isCustomer && statusAllowsOtp) {
      // Expose OTP
    } else {
      delete sanitizedRide.otp;
    }

    return NextResponse.json(sanitizedRide);
  } catch (error: any) {
    console.error('Error fetching ride status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
