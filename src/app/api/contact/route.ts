import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const { fullName, phone, message } = await request.json();

    if (!fullName || !phone) {
      return NextResponse.json(
        { error: 'Name and phone number are required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Resend API key is not configured.' },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: 'Viji Drop Taxi <info@vijitaxi.com>',
      to: 'vijaykumarr782@gmail.com',
      subject: `New Contact Inquiry from ${fullName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; borderRadius: 8px;">
          <h2 style="color: #1E293B; border-bottom: 2px solid #F97316; padding-bottom: 10px;">New Inquiry Received</h2>
          <p><strong>Name:</strong> ${fullName}</p>
          <p><strong>Phone:</strong> +91 ${phone}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="background: #F8FAFC; padding: 15px; border-left: 5px solid #F97316; margin: 0; color: #475569; font-style: italic;">
            ${message || 'No message provided.'}
          </blockquote>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
          <p style="font-size: 0.8rem; color: #94A3B8;">This email was sent automatically from the Viji Drop Taxi contact form.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Contact API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while sending the message.' },
      { status: 500 }
    );
  }
}
