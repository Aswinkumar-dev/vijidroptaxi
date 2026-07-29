import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');

    if (!input || input.trim().length < 2) {
      return NextResponse.json({ predictions: [] });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      // Fallback to OpenStreetMap Nominatim API
      const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
      nominatimUrl.searchParams.set('q', input);
      nominatimUrl.searchParams.set('format', 'json');
      nominatimUrl.searchParams.set('limit', '8');
      nominatimUrl.searchParams.set('countrycodes', 'in'); // Limit to India
      
      const response = await fetch(nominatimUrl.toString(), {
        headers: {
          'User-Agent': 'VijiDropTaxi/1.0 (saswikumar@gmail.com)'
        }
      });
      if (!response.ok) {
        throw new Error(`Nominatim geocoding failed: ${response.status}`);
      }
      const data = await response.json();
      
      const predictions = (data || []).map((item: any) => {
        const parts = item.display_name.split(',');
        const mainText = parts[0]?.trim() || '';
        const secondaryText = parts.slice(1).join(',').trim() || '';
        return {
          description: item.display_name,
          place_id: `coords:${item.lat},${item.lon}`, // encode coordinates directly
          main_text: mainText,
          secondary_text: secondaryText,
        };
      });
      return NextResponse.json({ predictions });
    }

    // Use Google Places Autocomplete API
    // Bias results to Tamil Nadu, India (but not strictly bounded so nearby places also appear)
    const googleUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    googleUrl.searchParams.set('input', input);
    googleUrl.searchParams.set('key', apiKey);
    googleUrl.searchParams.set('components', 'country:in');
    // Bias towards Tamil Nadu center (Trichy area)
    googleUrl.searchParams.set('location', '10.7905,78.7047');
    googleUrl.searchParams.set('radius', '300000'); // 300km radius bias
    googleUrl.searchParams.set('language', 'en');

    const response = await fetch(googleUrl.toString());
    const data = await response.json();

    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      const predictions = (data.predictions || []).map((p: any) => ({
        description: p.description,
        place_id: p.place_id,
        main_text: p.structured_formatting?.main_text || '',
        secondary_text: p.structured_formatting?.secondary_text || '',
      }));
      return NextResponse.json({ predictions });
    } else {
      console.error('Google Places API error:', data.status, data.error_message);
      return NextResponse.json(
        { error: data.error_message || 'Google Places API error', status: data.status },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Places API proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch place suggestions.' },
      { status: 500 }
    );
  }
}
