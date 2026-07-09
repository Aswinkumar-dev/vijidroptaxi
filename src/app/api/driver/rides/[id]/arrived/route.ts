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

    // Get user profile
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

    // Verify ride ownership and status
    const { data: ride, error: rideError } = await adminSupabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (rideError || !ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    if (ride.driver_id !== driver.id) {
      return NextResponse.json({ error: 'Forbidden: You are not assigned to this ride' }, { status: 403 });
    }

    if (ride.status !== 'confirmed') {
      return NextResponse.json({ error: `Invalid transition: Current status is ${ride.status}` }, { status: 400 });
    }

    // Update status to driver_arrived
    const { data: updatedRide, error: updateError } = await adminSupabase
      .from('rides')
      .update({
        status: 'driver_arrived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .select()
      .single();

    if (updateError) {
      console.error('Error setting driver arrived:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Record status history
    await adminSupabase.from('ride_status_history').insert({
      ride_id: rideId,
      status: 'driver_arrived',
      changed_by: user.id,
    });

    return NextResponse.json({
      message: 'Status updated to driver_arrived',
      ride: updatedRide,
    });
  } catch (error: any) {
    console.error('Server error setting driver arrived:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
