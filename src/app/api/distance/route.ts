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
    const isCoordsOrigin = originPlaceId?.startsWith('coords:');
    const isCoordsDest = destinationPlaceId?.startsWith('coords:');
    const useOSRM = !apiKey || isCoordsOrigin || isCoordsDest;

    if (useOSRM) {
      // Resolve coordinates for origin
      let originCoords: { lat: number; lon: number } | null = null;
      if (isCoordsOrigin) {
        const [lat, lon] = originPlaceId!.substring(7).split(',');
        originCoords = { lat: parseFloat(lat), lon: parseFloat(lon) };
      } else {
        const searchVal = origin || '';
        const searchUrl = new URL('https://nominatim.openstreetmap.org/search');
        searchUrl.searchParams.set('q', searchVal);
        searchUrl.searchParams.set('format', 'json');
        searchUrl.searchParams.set('limit', '1');
        searchUrl.searchParams.set('countrycodes', 'in');
        const res = await fetch(searchUrl.toString(), {
          headers: { 'User-Agent': 'VijiDropTaxi/1.0 (saswikumar@gmail.com)' }
        });
        const data = await res.json();
        if (data && data[0]) {
          originCoords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
      }

      // Resolve coordinates for destination
      let destCoords: { lat: number; lon: number } | null = null;
      if (isCoordsDest) {
        const [lat, lon] = destinationPlaceId!.substring(7).split(',');
        destCoords = { lat: parseFloat(lat), lon: parseFloat(lon) };
      } else {
        const searchVal = destination || '';
        const searchUrl = new URL('https://nominatim.openstreetmap.org/search');
        searchUrl.searchParams.set('q', searchVal);
        searchUrl.searchParams.set('format', 'json');
        searchUrl.searchParams.set('limit', '1');
        searchUrl.searchParams.set('countrycodes', 'in');
        const res = await fetch(searchUrl.toString(), {
          headers: { 'User-Agent': 'VijiDropTaxi/1.0 (saswikumar@gmail.com)' }
        });
        const data = await res.json();
        if (data && data[0]) {
          destCoords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
      }

      if (!originCoords || !destCoords) {
        return NextResponse.json({ error: 'Could not resolve location coordinates.' }, { status: 400 });
      }

      try {
        // Query Project OSRM API for exact driving distance
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}?overview=false`;
        const osrmRes = await fetch(osrmUrl, {
          headers: { 'User-Agent': 'VijiDropTaxi/1.0 (saswikumar@gmail.com)' }
        });
        if (!osrmRes.ok) {
          throw new Error(`OSRM API error: ${osrmRes.status}`);
        }
        const osrmData = await osrmRes.json();
        if (osrmData.code === 'Ok' && osrmData.routes?.[0]) {
          const route = osrmData.routes[0];
          const distanceKm = Math.round(route.distance / 1000);
          const durationSeconds = route.duration;
          const durationMinutes = Math.round(durationSeconds / 60);
          const durationHours = Math.floor(durationMinutes / 60);
          const remainingMinutes = durationMinutes % 60;
          
          let durationText = '';
          if (durationHours > 0) {
            durationText = `${durationHours} hour${durationHours > 1 ? 's' : ''} ${remainingMinutes} min${remainingMinutes > 1 ? 's' : ''}`;
          } else {
            durationText = `${durationMinutes} min${durationMinutes > 1 ? 's' : ''}`;
          }

          return NextResponse.json({
            distanceKm,
            durationText,
            distanceText: `${distanceKm} km`
          });
        } else {
          throw new Error(`OSRM route not found: ${osrmData.code}`);
        }
      } catch (osrmErr) {
        console.warn('OSRM routing failed, falling back to Haversine straight-line distance:', osrmErr);
        // Robust Fallback: Haversine distance * 1.25 for driving estimation
        const haversineDist = getHaversineDistanceKm(
          originCoords.lat,
          originCoords.lon,
          destCoords.lat,
          destCoords.lon
        );
        const distanceKm = Math.round(haversineDist * 1.25);
        // Estimate 60 km/h average speed
        const durationMinutes = Math.round((distanceKm / 60) * 60);
        const durationHours = Math.floor(durationMinutes / 60);
        const remainingMinutes = durationMinutes % 60;
        let durationText = '';
        if (durationHours > 0) {
          durationText = `${durationHours} hour${durationHours > 1 ? 's' : ''} ${remainingMinutes} min${remainingMinutes > 1 ? 's' : ''}`;
        } else {
          durationText = `${durationMinutes} min${durationMinutes > 1 ? 's' : ''}`;
        }

        return NextResponse.json({
          distanceKm,
          durationText,
          distanceText: `${distanceKm} km (Est.)`
        });
      }
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

function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
