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

export async function GET(req: NextRequest) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();
    const { data: cars, error } = await adminSupabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cars:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cars });
  } catch (error: any) {
    console.error('Server error fetching cars:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
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

    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (body.registration_number !== undefined) updateData.registration_number = body.registration_number.trim().toUpperCase();
    if (body.brand !== undefined) updateData.brand = body.brand.trim();
    if (body.model !== undefined) updateData.model = body.model.trim();
    if (body.color !== undefined) updateData.color = body.color.trim();
    if (body.car_type !== undefined) updateData.car_type = body.car_type;
    if (body.seating_capacity !== undefined) updateData.seating_capacity = body.seating_capacity;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const adminSupabase = createAdminClient();

    const { data: car, error } = await adminSupabase
      .from('cars')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vehicle:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A vehicle with this registration plate number is already registered.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Vehicle updated successfully', car });
  } catch (error: any) {
    console.error('Server error updating car:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
