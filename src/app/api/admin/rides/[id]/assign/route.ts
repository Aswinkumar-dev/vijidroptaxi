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

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    const { driver_id, car_id } = await req.json();

    if (!driver_id || !car_id) {
      return NextResponse.json({ error: 'driver_id and car_id are required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Verify driver exists and is active
    const { data: driver, error: driverError } = await adminSupabase
      .from('drivers')
      .select('*')
      .eq('id', driver_id)
      .single();

    if (driverError || !driver || !driver.is_active) {
      return NextResponse.json({ error: 'Active driver not found' }, { status: 404 });
    }

    // Verify car exists and is active
    const { data: car, error: carError } = await adminSupabase
      .from('cars')
      .select('*')
      .eq('id', car_id)
      .single();

    if (carError || !car || !car.is_active) {
      return NextResponse.json({ error: 'Active vehicle not found' }, { status: 404 });
    }

    // Generate random 4-digit OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Update ride to confirmed with assigned driver, car, and OTP
    const { data: updatedRide, error: updateError } = await adminSupabase
      .from('rides')
      .update({
        driver_id,
        car_id,
        otp: generatedOtp,
        status: 'confirmed',
        otp_attempts: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .select()
      .single();

    if (updateError) {
      console.error('Error assigning driver:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Record status history
    await adminSupabase.from('ride_status_history').insert({
      ride_id: rideId,
      status: 'confirmed',
      changed_by: user.id,
    });

    return NextResponse.json({
      message: 'Driver and car assigned successfully',
      ride: updatedRide,
    });
  } catch (error: any) {
    console.error('Server error assigning driver:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
