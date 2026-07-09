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

    const { rating, comment } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Retrieve ride details
    const { data: ride, error: rideError } = await adminSupabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (rideError || !ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    // Verify user is the customer of the ride
    if (ride.customer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only review your own rides' }, { status: 403 });
    }

    // Verify ride is completed
    if (ride.status !== 'completed') {
      return NextResponse.json({ error: 'Cannot review a ride that is not completed' }, { status: 400 });
    }

    if (!ride.driver_id) {
      return NextResponse.json({ error: 'Cannot review a ride that was not assigned a driver' }, { status: 400 });
    }

    // Create the review
    const { data: review, error: reviewError } = await adminSupabase
      .from('reviews')
      .insert({
        ride_id: rideId,
        customer_id: user.id,
        driver_id: ride.driver_id,
        rating,
        comment,
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      // Check for unique constraint (already reviewed)
      if (reviewError.code === '23505') {
        return NextResponse.json({ error: 'You have already submitted a review for this ride' }, { status: 409 });
      }
      return NextResponse.json({ error: reviewError.message }, { status: 500 });
    }

    // Recalculate and update driver average rating
    const { data: allReviews, error: reviewsFetchError } = await adminSupabase
      .from('reviews')
      .select('rating')
      .eq('driver_id', ride.driver_id);

    if (!reviewsFetchError && allReviews && allReviews.length > 0) {
      const sum = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
      const average = parseFloat((sum / allReviews.length).toFixed(1));

      const { error: driverUpdateError } = await adminSupabase
        .from('drivers')
        .update({
          rating_avg: average,
        })
        .eq('id', ride.driver_id);

      if (driverUpdateError) {
        console.error('Error updating driver rating average:', driverUpdateError);
      }
    }

    return NextResponse.json({
      message: 'Review submitted successfully',
      review,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Server error submitting review:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
