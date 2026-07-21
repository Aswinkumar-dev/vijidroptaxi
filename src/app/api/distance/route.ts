import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const originPlaceId = searchParams.get('origin_place_id');
    const destinationPlaceId = searchParams.get('destination_place_id');

    if ((!origin && !originPlaceId) || (!destination && !destinationPlaceId)) {
      return NextResponse.json({ error: 'Missing origin or destination parameters.' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Places API key is not configured.' }, { status: 500 });
    }

    const googleUrl = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    
    // Prefer place ID as it is more precise for Google, fallback to text description
    const originParam = originPlaceId ? `place_id:${originPlaceId}` : origin!;
    const destParam = destinationPlaceId ? `place_id:${destinationPlaceId}` : destination!;

    googleUrl.searchParams.set('origins', originParam);
    googleUrl.searchParams.set('destinations', destParam);
    googleUrl.searchParams.set('key', apiKey);
    googleUrl.searchParams.set('units', 'metric');

    const response = await fetch(googleUrl.toString());
    const data = await response.json();

    if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
      const element = data.rows[0].elements[0];
      const distanceMeters = element.distance.value; // in meters
      const distanceKm = Math.round(distanceMeters / 1000); // round to nearest KM
      const durationSeconds = element.duration.value;

      return NextResponse.json({
        distanceKm,
        durationText: element.duration.text,
        distanceText: element.distance.text
      });
    } else {
      const elementStatus = data.rows?.[0]?.elements?.[0]?.status;
      console.error('Distance Matrix API error:', data.status, data.error_message || elementStatus);
      return NextResponse.json({ 
        error: data.error_message || `Distance Matrix returned error: ${elementStatus || data.status}`,
        status: data.status 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Distance API proxy error:', error);
    return NextResponse.json({ error: error.message || 'Failed to calculate distance.' }, { status: 500 });
  }
}
