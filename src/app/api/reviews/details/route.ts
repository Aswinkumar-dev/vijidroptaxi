import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rideId = searchParams.get('ride_id');

    if (!rideId) {
      return NextResponse.json({ error: 'ride_id query parameter is required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Query ride joined with driver profile and car details
    const { data: ride, error: rideError } = await adminSupabase
      .from('rides')
      .select(`
        id,
        customer_name,
        pickup_address,
        drop_address,
        driver:drivers(
          id,
          profile:profiles(full_name)
        ),
        car:cars(brand, model, registration_number)
      `)
      .eq('id', rideId)
      .single();

    if (rideError || !ride) {
      return NextResponse.json({ error: 'Ride booking not found' }, { status: 404 });
    }

    // Check if it has already been reviewed
    const { data: existingReview } = await adminSupabase
      .from('reviews')
      .select('id')
      .eq('ride_id', rideId)
      .maybeSingle();

    const car = ride.car as any;

    return NextResponse.json({
      id: ride.id,
      customer_name: ride.customer_name,
      pickup_address: ride.pickup_address,
      drop_address: ride.drop_address,
      driver_name: (ride.driver as any)?.profile?.full_name || 'Assigned Driver',
      car_details: car ? `${car.brand} ${car.model} (${car.registration_number})` : null,
      already_reviewed: !!existingReview,
    });
  } catch (error: any) {
    console.error('Error fetching public ride details for review:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
