import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const adminClient = createAdminClient();

    const body = await req.json();
    const {
      full_name,
      phone,
      ride_type,
      pickup_address,
      drop_address,
      scheduled_at,
      return_scheduled_at,
      car_type,
      distance_km,
      payment_mode,
    } = body;

    // Validation
    if (!full_name || !phone || !ride_type || !pickup_address || !drop_address || !scheduled_at || !car_type || !distance_km || !payment_mode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Clean phone number
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      return NextResponse.json({ error: 'Phone number must be exactly 10 digits' }, { status: 400 });
    }
    const formattedPhone = '+91' + digitsOnly;

    // Fetch fare rule
    const { data: fareRule } = await adminClient
      .from('fare_rules')
      .select('*')
      .eq('car_type', car_type)
      .eq('ride_type', ride_type)
      .order('applicable_from', { ascending: false })
      .limit(1)
      .maybeSingle();

    let per_km_rate = 15;

    if (fareRule) {
      per_km_rate = Number(fareRule.per_km_rate);
    } else {
      if (car_type === 'innova') {
        per_km_rate = ride_type === 'one_way' ? 21 : 20;
      } else if (car_type === 'suv') {
        per_km_rate = ride_type === 'one_way' ? 20 : 19;
      } else {
        per_km_rate = ride_type === 'one_way' ? 15 : 14;
      }
    }

    const calculated_distance = ride_type === 'one_way' 
      ? Math.max(Number(distance_km), 130) 
      : Math.max(Number(distance_km) * 2, 250);
      
    const driver_allowance = 400;
    const total_fare = (calculated_distance * per_km_rate) + driver_allowance;

    const notesStr = return_scheduled_at
      ? `Return Trip: ${new Date(return_scheduled_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })} ${new Date(return_scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
      : null;

    // Insert ride directly — no auth, no profile creation
    const { data: ride, error: rideError } = await adminClient
      .from('rides')
      .insert({
        customer_name: full_name.trim(),
        customer_phone: formattedPhone,
        ride_type,
        pickup_address,
        drop_address,
        scheduled_at,
        car_type,
        distance_km: calculated_distance,
        total_fare,
        payment_mode,
        status: 'pending',
        notes: notesStr,
      })
      .select()
      .single();

    if (rideError || !ride) {
      console.error('Error creating ride:', rideError);
      return NextResponse.json({ error: rideError?.message || 'Failed to create booking.' }, { status: 500 });
    }

    // Send Telegram alert in the background
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (botToken && chatId) {
      const msg = `🎉 *New Booking Confirmed!*\n` +
                  `*Name:* ${ride.customer_name}\n` +
                  `*Phone:* ${ride.customer_phone}\n` +
                  `*Ride Type:* ${ride_type === 'one_way' ? 'One Way' : 'Round Trip'}\n` +
                  `*Pickup:* ${pickup_address}\n` +
                  `*Drop:* ${drop_address}\n` +
                  `*Date/Time:* ${new Date(scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n` +
                  `*Car Type:* ${car_type.toUpperCase()}\n` +
                  `*Distance:* ${calculated_distance} KM\n` +
                  `*Total Fare:* ₹${total_fare}`;
                  
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
      }).catch(err => console.error('Telegram notification error:', err));
    }

    return NextResponse.json({ id: ride.id, message: 'Booking created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Server error during guest booking:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
