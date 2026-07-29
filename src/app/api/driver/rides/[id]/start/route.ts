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

    if (profileError || !profile || (profile.role !== 'driver' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden: Drivers and Admins only' }, { status: 403 });
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

    // Verify ride state
    if (ride.status !== 'driver_arrived') {
      return NextResponse.json({ error: `Invalid transition: Current status is ${ride.status}` }, { status: 400 });
    }

    // SUCCESS: Transition status to ongoing (started)
    const { data: updatedRide, error: updateError } = await adminSupabase
      .from('rides')
      .update({
        status: 'ongoing',
        started_at: new Date().toISOString(),
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
      message: 'Ride started successfully.',
      ride: updatedRide,
    });
  } catch (error: any) {
    console.error('Server error starting ride:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
