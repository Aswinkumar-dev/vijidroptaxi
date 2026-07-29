import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabaseServer';

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

export async function POST(req: NextRequest) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
    }

    const { registration_number, brand, model, color, car_type, seating_capacity, is_active } = await req.json();

    if (!registration_number || !brand || !model || !color) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data: car, error } = await adminSupabase
      .from('cars')
      .insert({
        registration_number: registration_number.trim().toUpperCase(),
        brand: brand.trim(),
        model: model.trim(),
        color: color.trim(),
        car_type,
        seating_capacity: seating_capacity || 4,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting vehicle:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A vehicle with this registration plate number is already registered.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Vehicle added successfully', car }, { status: 201 });
  } catch (error: any) {
    console.error('Server error adding car:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
    }

    const { id, is_active } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data: car, error } = await adminSupabase
      .from('cars')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vehicle:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Vehicle updated successfully', car });
  } catch (error: any) {
    console.error('Server error updating car:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
