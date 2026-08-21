import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabaseServer';
import { getCache, setCache } from '@/lib/apiCache';

const CACHE_TTL = 20_000; // 20 seconds per user

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

    // Serve from per-user cache if fresh
    const cacheKey = `driver:profile:${user.id}`;
    const cached = getCache<object>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'private, max-age=20, stale-while-revalidate=40' },
      });
    }

    const adminSupabase = createAdminClient();

    // Fetch profile and driver record in parallel
    const [profileResult, driverResult] = await Promise.all([
      supabase.from('profiles').select('id, full_name, phone, role').eq('id', user.id).single(),
      adminSupabase.from('drivers').select('*, car:cars(*)').eq('profile_id', user.id).maybeSingle(),
    ]);

    const { data: profile, error: profileError } = profileResult;
    const { data: driver, error: driverError } = driverResult;

    if (profileError || !profile || (profile.role !== 'driver' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden: Drivers and Admins only' }, { status: 403 });
    }

    if (driverError) {
      console.error('Error fetching driver profile:', driverError);
      return NextResponse.json({ error: driverError.message }, { status: 500 });
    }

    const result = { driver, profile };
    setCache(cacheKey, result, CACHE_TTL);

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, max-age=20, stale-while-revalidate=40' },
    });
  } catch (error: any) {
    console.error('Server error fetching driver profile:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
