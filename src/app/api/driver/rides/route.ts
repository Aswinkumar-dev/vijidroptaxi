import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabaseServer';
import { getCache, setCache } from '@/lib/apiCache';

const CACHE_TTL_ACTIVE = 10_000;  // 10s for active rides (changes more often)
const CACHE_TTL_HISTORY = 30_000; // 30s for completed history (rarely changes)

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const history = url.searchParams.get('history') === 'true';

    // Fetch profile and driver record in parallel (eliminates second sequential query)
    const adminSupabase = createAdminClient();
    const [profileResult, driverResult] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).single(),
      adminSupabase.from('drivers').select('id').eq('profile_id', user.id).single(),
    ]);

    const { data: profile, error: profileError } = profileResult;
    if (profileError || !profile || (profile.role !== 'driver' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden: Drivers and Admins only' }, { status: 403 });
    }

    const { data: driver, error: driverError } = driverResult;
    if (driverError || !driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    // Per-driver + per-type cache key
    const cacheKey = `driver:rides:${driver.id}:${history ? 'history' : 'active'}`;
    const cached = getCache<any[]>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': `private, max-age=${history ? 30 : 10}, stale-while-revalidate=${history ? 60 : 20}` },
      });
    }

    // Fetch rides for this driver
    let dbQuery = adminSupabase
      .from('rides')
      .select(`
        *,
        customer:profiles!rides_customer_id_fkey(id, full_name, phone),
        car:cars(*)
      `)
      .eq('driver_id', driver.id);

    if (history) {
      dbQuery = dbQuery.eq('status', 'completed');
    } else {
      dbQuery = dbQuery.in('status', ['confirmed', 'driver_arrived', 'ongoing']);
    }

    const { data: rides, error: ridesError } = await dbQuery
      .order('scheduled_at', { ascending: !history });

    if (ridesError) {
      console.error('Error fetching driver rides:', ridesError);
      return NextResponse.json({ error: ridesError.message }, { status: 500 });
    }

    // Remove OTP from active rides for security
    const sanitizedRides = (rides || []).map(ride => {
      const sanitized = { ...ride };
      delete sanitized.otp;
      return sanitized;
    });

    setCache(cacheKey, sanitizedRides, history ? CACHE_TTL_HISTORY : CACHE_TTL_ACTIVE);

    return NextResponse.json(sanitizedRides, {
      headers: { 'Cache-Control': `private, max-age=${history ? 30 : 10}, stale-while-revalidate=${history ? 60 : 20}` },
    });
  } catch (error: any) {
    console.error('Server error fetching driver rides:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
