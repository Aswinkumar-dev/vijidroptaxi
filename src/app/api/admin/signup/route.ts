import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const body = await req.json();

    const { full_name, email, phone, password } = body;

    if (!full_name || !email || !phone || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      return NextResponse.json({ error: 'Phone number must be exactly 10 digits.' }, { status: 400 });
    }

    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create account.' }, { status: 400 });
    }

    const userId = authData.user.id;
    const formattedPhone = '+91' + digitsOnly;

    // Insert profile with role = 'pending_admin'
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: userId,
      full_name: full_name.trim(),
      phone: formattedPhone,
      role: 'pending_admin',
      kyc_status: 'not_required',
    });

    if (profileError) {
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Failed to save profile: ' + profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Admin signup error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
