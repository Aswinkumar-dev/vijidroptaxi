import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const formData = await req.formData();

    const fullName = (formData.get('full_name') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const dob = (formData.get('dob') as string)?.trim();
    const password = formData.get('password') as string;
    const aadharFile = formData.get('aadhar_card') as File | null;
    const licenseFile = formData.get('driving_license') as File | null;

    // Validate required fields
    if (!fullName || !phone || !email || !dob || !password || !aadharFile || !licenseFile) {
      return NextResponse.json({ error: 'All fields including documents are required.' }, { status: 400 });
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      return NextResponse.json({ error: 'Phone number must be exactly 10 digits.' }, { status: 400 });
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create account.' }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Upload Aadhar card
    const aadharBuffer = await aadharFile.arrayBuffer();
    const aadharExt = aadharFile.name.split('.').pop();
    const aadharPath = `${userId}/aadhar.${aadharExt}`;

    const { error: aadharUploadError } = await adminClient.storage
      .from('driver-kyc')
      .upload(aadharPath, aadharBuffer, {
        contentType: aadharFile.type,
        upsert: true,
      });

    if (aadharUploadError) {
      // Cleanup created user
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Failed to upload Aadhar card: ' + aadharUploadError.message }, { status: 500 });
    }

    // 3. Upload Driving License
    const licenseBuffer = await licenseFile.arrayBuffer();
    const licenseExt = licenseFile.name.split('.').pop();
    const licensePath = `${userId}/license.${licenseExt}`;

    const { error: licenseUploadError } = await adminClient.storage
      .from('driver-kyc')
      .upload(licensePath, licenseBuffer, {
        contentType: licenseFile.type,
        upsert: true,
      });

    if (licenseUploadError) {
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Failed to upload Driving License: ' + licenseUploadError.message }, { status: 500 });
    }

    const formattedPhone = '+91' + digitsOnly;

    // 4. Create profile
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: userId,
      full_name: fullName,
      phone: formattedPhone,
      role: 'driver',
      kyc_status: 'pending',
      dob: dob,
      aadhar_card_url: aadharPath,
      driving_license_url: licensePath,
    });

    if (profileError) {
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Failed to save profile: ' + profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Driver registration submitted successfully.' }, { status: 201 });
  } catch (error: any) {
    console.error('Driver signup error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
