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

    const apiKey = process.env.GOOGLE_PLACES_API_KEY ||
                   process.env.GOOGLE_MAPS_API_KEY ||
                   process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
                   process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const isCoordsOrigin = originPlaceId?.startsWith('coords:');
    const isCoordsDest = destinationPlaceId?.startsWith('coords:');

    // ── Try Google Distance Matrix first if API key is present ──────────────
    if (apiKey) {
      try {
        const googleUrl = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');

        const originParam = isCoordsOrigin
          ? originPlaceId!.substring(7)
          : (originPlaceId ? `place_id:${originPlaceId}` : origin!);

        const destParam = isCoordsDest
          ? destinationPlaceId!.substring(7)
          : (destinationPlaceId ? `place_id:${destinationPlaceId}` : destination!);

        googleUrl.searchParams.set('origins', originParam);
        googleUrl.searchParams.set('destinations', destParam);
        googleUrl.searchParams.set('key', apiKey);
        googleUrl.searchParams.set('units', 'metric');

        const response = await fetch(googleUrl.toString());
        const data = await response.json();

        if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
          const element = data.rows[0].elements[0];
          const distanceKm = Math.round(element.distance.value / 1000);
          return NextResponse.json({
            distanceKm,
            durationText: element.duration.text,
            distanceText: element.distance.text,
          });
        }

        // Google returned a non-OK status — log and fall through to OSRM
        const elementStatus = data.rows?.[0]?.elements?.[0]?.status;
        console.warn('Google Distance Matrix non-OK, falling back to OSRM:', data.status, data.error_message || elementStatus);
      } catch (googleErr) {
        console.warn('Google Distance Matrix request failed, falling back to OSRM:', googleErr);
      }
    }

    // ── OSRM / Haversine fallback ────────────────────────────────────────────
    // Resolve coordinates for origin
    let originCoords: { lat: number; lon: number } | null = null;
    if (isCoordsOrigin) {
      const [lat, lon] = originPlaceId!.substring(7).split(',');
      originCoords = { lat: parseFloat(lat), lon: parseFloat(lon) };
    } else if (originPlaceId && apiKey) {
      // Google Place ID — resolve via Geocoding API
      originCoords = await geocodeGooglePlaceId(originPlaceId, apiKey);
    }
    if (!originCoords) {
      // Last resort: text geocoding via Nominatim
      originCoords = await geocodeWithNominatim(origin || '');
    }

    // Resolve coordinates for destination
    let destCoords: { lat: number; lon: number } | null = null;
    if (isCoordsDest) {
      const [lat, lon] = destinationPlaceId!.substring(7).split(',');
      destCoords = { lat: parseFloat(lat), lon: parseFloat(lon) };
    } else if (destinationPlaceId && apiKey) {
      // Google Place ID — resolve via Geocoding API
      destCoords = await geocodeGooglePlaceId(destinationPlaceId, apiKey);
    }
    if (!destCoords) {
      // Last resort: text geocoding via Nominatim
      destCoords = await geocodeWithNominatim(destination || '');
    }

    if (!originCoords || !destCoords) {
      return NextResponse.json({ error: 'Could not resolve location coordinates.' }, { status: 400 });
    }

    // Try OSRM for driving distance
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}?overview=false`;
      const osrmRes = await fetch(osrmUrl, {
        headers: { 'User-Agent': 'VijiDropTaxi/1.0 (saswikumar@gmail.com)' },
        signal: AbortSignal.timeout(8000),
      });

      if (!osrmRes.ok) throw new Error(`OSRM HTTP ${osrmRes.status}`);

      const osrmData = await osrmRes.json();
      if (osrmData.code === 'Ok' && osrmData.routes?.[0]) {
        const route = osrmData.routes[0];
        const distanceKm = Math.round(route.distance / 1000);
        const durationText = formatDuration(Math.round(route.duration / 60));
        return NextResponse.json({
          distanceKm,
          durationText,
          distanceText: `${distanceKm} km`,
        });
      }
      throw new Error(`OSRM route not found: ${osrmData.code}`);
    } catch (osrmErr) {
      console.warn('OSRM failed, using Haversine estimate:', osrmErr);
    }

    // Final fallback: Haversine straight-line × 1.3 road factor
    const straight = getHaversineDistanceKm(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon);
    const distanceKm = Math.round(straight * 1.3);
    const durationText = formatDuration(Math.round((distanceKm / 60) * 60));
    return NextResponse.json({
      distanceKm,
      durationText,
      distanceText: `${distanceKm} km (Est.)`,
    });

  } catch (error: any) {
    console.error('Distance API proxy error:', error);
    return NextResponse.json({ error: error.message || 'Failed to calculate distance.' }, { status: 500 });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve a Google Place ID to lat/lon using the Geocoding API */
async function geocodeGooglePlaceId(placeId: string, apiKey: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('key', apiKey);
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      const loc = data.results[0].geometry.location;
      return { lat: loc.lat, lon: loc.lng };
    }
  } catch {
    // silent
  }
  return null;
}

/** Geocode a free-text location using Nominatim (India only) */
async function geocodeWithNominatim(query: string): Promise<{ lat: number; lon: number } | null> {
  if (!query.trim()) return null;
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'in');
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'VijiDropTaxi/1.0 (saswikumar@gmail.com)' },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    // silent
  }
  return null;
}

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
  return `${totalMinutes} min${totalMinutes !== 1 ? 's' : ''}`;
}

function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
