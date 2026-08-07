import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabaseServer';

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

    // Verify role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || (profile.role !== 'driver' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden: Drivers and Admins only' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();

    // Get driver record
    const { data: driver, error: driverError } = await adminSupabase
      .from('drivers')
      .select(`
        *,
        car:cars(*)
      `)
      .eq('profile_id', user.id)
      .maybeSingle();

    if (driverError) {
      console.error('Error fetching driver profile:', driverError);
      return NextResponse.json({ error: driverError.message }, { status: 500 });
    }

    return NextResponse.json({ driver, profile });
  } catch (error: any) {
    console.error('Server error fetching driver profile:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
