import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const { ride_id, driver_id, rating, comment } = await req.json();

    if (!rating) {
      return NextResponse.json({ error: 'rating is required' }, { status: 400 });
    }

    if (!ride_id && !driver_id) {
      return NextResponse.json({ error: 'Either ride_id or driver_id is required' }, { status: 400 });
    }

    const ratingVal = parseInt(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    let finalDriverId = driver_id;

    if (ride_id) {
      // Check if the ride exists and get its driver_id
      const { data: ride, error: rideError } = await adminSupabase
        .from('rides')
        .select('driver_id, status')
        .eq('id', ride_id)
        .single();

      if (rideError || !ride) {
        return NextResponse.json({ error: 'Ride booking not found' }, { status: 404 });
      }

      if (!ride.driver_id) {
        return NextResponse.json({ error: 'No driver is assigned to this ride' }, { status: 400 });
      }
      
      finalDriverId = ride.driver_id;
    }

    // Insert review into database
    const { data: review, error: reviewError } = await adminSupabase
      .from('reviews')
      .insert({
        ride_id: ride_id || null,
        driver_id: finalDriverId,
        rating: ratingVal,
        comment: comment?.trim() || null,
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error inserting review:', reviewError);
      // Handle unique constraint check
      if (reviewError.code === '23505') {
        return NextResponse.json({ error: 'You have already submitted a review for this ride' }, { status: 409 });
      }
      return NextResponse.json({ error: reviewError.message }, { status: 500 });
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
