import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabaseServer';

export async function POST(
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

    // Get user profile role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'driver') {
      return NextResponse.json({ error: 'Forbidden: Drivers only' }, { status: 403 });
    }

    const { otp: submittedOtp } = await req.json();
    if (!submittedOtp) {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
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

    // Retrieve ride detail (including true OTP and attempts)
    const { data: ride, error: rideError } = await adminSupabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (rideError || !ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    // Verify driver assignment
    if (ride.driver_id !== driver.id) {
      return NextResponse.json({ error: 'Forbidden: You are not assigned to this ride' }, { status: 403 });
    }

    // Verify ride state
    if (ride.status !== 'driver_arrived') {
      return NextResponse.json({ error: 'Ride is not in driver_arrived state' }, { status: 400 });
    }

    // Check attempt threshold (limit = 5)
    if (ride.otp_attempts >= 5) {
      return NextResponse.json({
        error: 'OTP verification locked due to too many failed attempts. Please contact admin to reset.',
        locked: true,
      }, { status: 423 }); // 423 Locked
    }

    // Check OTP guess
    if (ride.otp === submittedOtp.trim()) {
      // SUCCESS: Transition status to ongoing
      const { data: updatedRide, error: updateError } = await adminSupabase
        .from('rides')
        .update({
          status: 'ongoing',
          otp_verified_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          otp_attempts: 0, // Reset attempts on success
          updated_at: new Date().toISOString(),
        })
        .eq('id', rideId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating ride to ongoing:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Record status history
      await adminSupabase.from('ride_status_history').insert({
        ride_id: rideId,
        status: 'ongoing',
        changed_by: user.id,
      });

      return NextResponse.json({
        message: 'OTP verified successfully. Ride started.',
        ride: updatedRide,
      });
    } else {
      // FAILURE: Increment attempts
      const newAttemptsCount = (ride.otp_attempts || 0) + 1;
      const remainingAttempts = Math.max(0, 5 - newAttemptsCount);

      const { error: updateAttemptsError } = await adminSupabase
        .from('rides')
        .update({
          otp_attempts: newAttemptsCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rideId);

      if (updateAttemptsError) {
        console.error('Error updating OTP attempts:', updateAttemptsError);
      }

      return NextResponse.json({
        error: `Incorrect OTP. ${remainingAttempts} attempts remaining.`,
        remainingAttempts,
        locked: newAttemptsCount >= 5,
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Server error verifying OTP:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
