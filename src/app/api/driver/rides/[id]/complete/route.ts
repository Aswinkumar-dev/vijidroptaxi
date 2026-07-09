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

    const adminSupabase = createAdminClient();

    // Get driver record
    const { data: driver, error: driverError } = await adminSupabase
      .from('drivers')
      .select('*')
      .eq('profile_id', user.id)
      .single();

    if (driverError || !driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    // Retrieve ride details
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

    // Verify ride state is ongoing
    if (ride.status !== 'ongoing') {
      return NextResponse.json({ error: 'Ride is not in ongoing state' }, { status: 400 });
    }

    const totalFare = ride.total_fare || 0;

    // Update ride to completed
    const { data: updatedRide, error: updateError } = await adminSupabase
      .from('rides')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .select()
      .single();

    if (updateError) {
      console.error('Error completing ride:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Create payment entry
    const { error: paymentError } = await adminSupabase
      .from('payments')
      .insert({
        ride_id: rideId,
        amount: totalFare,
        mode: ride.payment_mode || 'cash',
        status: 'paid',
        collected_by: driver.id,
        collected_at: new Date().toISOString(),
        notes: 'Payment collected by driver upon completion',
      });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
    }

    // Update driver total rides
    const { error: driverUpdateError } = await adminSupabase
      .from('drivers')
      .update({
        total_rides: (driver.total_rides || 0) + 1,
      })
      .eq('id', driver.id);

    if (driverUpdateError) {
      console.error('Error updating driver total rides:', driverUpdateError);
    }

    // Record status history
    await adminSupabase.from('ride_status_history').insert({
      ride_id: rideId,
      status: 'completed',
      changed_by: user.id,
    });

    return NextResponse.json({
      message: 'Ride completed and payment collected.',
      ride: updatedRide,
    });
  } catch (error: any) {
    console.error('Server error completing ride:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
