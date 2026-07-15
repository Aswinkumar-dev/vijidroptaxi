import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabaseServer';

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Verify requesting user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { driver_id, action } = body; // action: 'approve' | 'reject'

    if (!driver_id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'driver_id and action (approve/reject) are required.' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { error } = await adminClient
      .from('profiles')
      .update({ kyc_status: newStatus })
      .eq('id', driver_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, kyc_status: newStatus });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}

// GET: fetch all drivers with their KYC details + signed URLs for docs
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: drivers, error } = await adminClient
      .from('profiles')
      .select('id, full_name, phone, dob, kyc_status, aadhar_card_url, driving_license_url, created_at')
      .eq('role', 'driver')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Generate signed URLs for each driver's documents
    const driversWithUrls = await Promise.all((drivers || []).map(async (driver) => {
      let aadharSignedUrl = null;
      let licenseSignedUrl = null;

      if (driver.aadhar_card_url) {
        const { data } = await adminClient.storage
          .from('driver-kyc')
          .createSignedUrl(driver.aadhar_card_url, 3600);
        aadharSignedUrl = data?.signedUrl || null;
      }

      if (driver.driving_license_url) {
        const { data } = await adminClient.storage
          .from('driver-kyc')
          .createSignedUrl(driver.driving_license_url, 3600);
        licenseSignedUrl = data?.signedUrl || null;
      }

      return { ...driver, aadhar_signed_url: aadharSignedUrl, license_signed_url: licenseSignedUrl };
    }));

    return NextResponse.json({ drivers: driversWithUrls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
