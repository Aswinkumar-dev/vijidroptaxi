import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const driverId = searchParams.get('driver_id');

    if (!driverId) {
      return NextResponse.json({ error: 'driver_id query parameter is required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Query driver joined with profile and car details
    const { data: driver, error: driverError } = await adminSupabase
      .from('drivers')
      .select(`
        id,
        profile:profiles(full_name),
        car:cars(brand, model, registration_number)
      `)
      .eq('id', driverId)
      .single();

    if (driverError || !driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const driverName = (driver.profile as any)?.full_name || 'Assigned Driver';
    const carDetails = (driver.car as any)
      ? `${(driver.car as any).brand} ${(driver.car as any).model} (${(driver.car as any).registration_number})`
      : null;

    return NextResponse.json({
      id: driver.id,
      driver_name: driverName,
      car_details: carDetails,
    });
  } catch (error: any) {
    console.error('Error fetching public driver details for review:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
