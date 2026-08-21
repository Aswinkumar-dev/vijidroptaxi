import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabaseServer';
import { getCache, setCache, invalidateCache } from '@/lib/apiCache';

const CACHE_KEY = 'admin:drivers';
const CACHE_KEY_UNLINKED = 'admin:drivers:unlinked';
const CACHE_TTL = 30_000; // 30 seconds — driver list is fairly stable

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') return null;
  return user.id;
}

export async function GET(req: NextRequest) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const unlinkedOnly = searchParams.get('unlinked') === 'true';
    const cacheKey = unlinkedOnly ? CACHE_KEY_UNLINKED : CACHE_KEY;

    // Serve from cache if fresh
    const cached = getCache<object>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
      });
    }

    const adminSupabase = createAdminClient();

    if (unlinkedOnly) {
      // Run both queries in parallel
      const [
        { data: profiles, error: profilesError },
        { data: linkedDrivers, error: driversError },
      ] = await Promise.all([
        adminSupabase.from('profiles').select('id, full_name, phone, role').in('role', ['driver', 'admin']),
        adminSupabase.from('drivers').select('profile_id'),
      ]);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return NextResponse.json({ error: profilesError.message }, { status: 500 });
      }
      if (driversError) {
        console.error('Error fetching linked drivers:', driversError);
        return NextResponse.json({ error: driversError.message }, { status: 500 });
      }

      const linkedIds = (linkedDrivers || []).map(d => d.profile_id);
      const unlinkedProfiles = (profiles || []).filter(p => !linkedIds.includes(p.id));
      const result = { profiles: unlinkedProfiles };

      setCache(cacheKey, result, CACHE_TTL);
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
      });
    }

    const { data: drivers, error } = await adminSupabase
      .from('drivers')
      .select(`
        *,
        profile:profiles(id, full_name, phone, role),
        car:cars(*)
      `)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching drivers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = { drivers };
    setCache(cacheKey, result, CACHE_TTL);

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });
  } catch (error: any) {
    console.error('Server error fetching drivers:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
    }

    const { profile_id, license_number, license_expiry, current_car_id, is_active } = await req.json();

    if (!profile_id || !license_number) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data: driver, error } = await adminSupabase
      .from('drivers')
      .insert({
        profile_id,
        license_number,
        license_expiry: license_expiry || null,
        current_car_id: current_car_id || null,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting driver:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A driver profile or license number already exists for this registration.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    invalidateCache('admin:drivers');
    return NextResponse.json({ message: 'Driver linked successfully', driver }, { status: 201 });
  } catch (error: any) {
    console.error('Server error linking driver:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
    }

    const { id, is_active, current_car_id, license_number, license_expiry } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (is_active !== undefined) updateData.is_active = is_active;
    if (current_car_id !== undefined) updateData.current_car_id = current_car_id;
    if (license_number !== undefined) updateData.license_number = license_number;
    if (license_expiry !== undefined) updateData.license_expiry = license_expiry;

    const adminSupabase = createAdminClient();

    const { data: driver, error } = await adminSupabase
      .from('drivers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating driver:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    invalidateCache('admin:drivers');
    return NextResponse.json({ message: 'Driver updated successfully', driver });
  } catch (error: any) {
    console.error('Server error updating driver:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
