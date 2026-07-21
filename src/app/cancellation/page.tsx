'use client';

import React from 'react';
import Link from 'next/link';
import { Ban, Calendar, CheckCircle, AlertTriangle, RefreshCw, Clock, UserCheck, Phone, Mail, Headphones } from 'lucide-react';

export default function CancellationPolicy() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentMonthYear = mounted
    ? new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    : 'July 2026';

  return (
    <div style={{
      padding: '4rem 1.5rem',
      backgroundColor: 'var(--bg-color)',
      minHeight: 'calc(100vh - var(--header-height) - 300px)',
      color: 'var(--text-color)',
      fontFamily: 'var(--font-secondary)'
    }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="card" style={{ padding: '3rem', lineHeight: '1.8' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
            <span style={{
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-full)',
              color: 'var(--primary)',
              display: 'inline-flex',
              marginBottom: '1rem'
            }}>
              <Ban size={32} />
            </span>
            <h1 style={{ color: 'var(--secondary)', marginBottom: '0.5rem', fontSize: '2.5rem' }}>Cancellation Policy</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Calendar size={14} /> Last Updated: {currentMonthYear}
            </p>
          </div>

          {/* Booking Cancellation */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--secondary)', fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertTriangle size={22} style={{ color: 'var(--primary)' }} />
              Booking Cancellation
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              If your travel plans change, please notify <strong>Viji Drop Taxi</strong> as early as possible. Cancellation requests are reviewed based on booking status, travel schedule and operational requirements.
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
              <li>Please notify us as early as possible if you need to cancel your booking.</li>
              <li>Cancellation requests are reviewed according to the current booking status.</li>
              <li>Changes requested after vehicle or driver allocation may incur applicable charges.</li>
            </ul>
          </section>

          {/* Refund Information */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--secondary)', fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <RefreshCw size={22} style={{ color: 'var(--primary)' }} />
              Refund Information
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              Where a refund is approved, it will normally be processed using the original payment method whenever possible. Processing time may vary depending on the payment provider or banking institution.
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
              <li>Refund eligibility depends on the booking details.</li>
              <li>Approved refunds are processed using the original payment method where possible. Processing times depend on your bank or payment provider.</li>
            </ul>
          </section>

          {/* Travel Schedule Changes */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--secondary)', fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Clock size={22} style={{ color: 'var(--primary)' }} />
              Travel Schedule Changes
            </h2>
            <p>
              Customers may request updates to the pickup time, travel date or destination before vehicle dispatch, subject to operational availability.
            </p>
          </section>

          {/* Customer Responsibilities */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--secondary)', fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <UserCheck size={22} style={{ color: 'var(--primary)' }} />
              Customer Responsibilities
            </h2>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
              <li>Provide complete and accurate booking information.</li>
              <li>Be available at the agreed pickup location.</li>
              <li>Inform our team immediately if your travel plans change.</li>
            </ul>
          </section>

          {/* Need Booking Support */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--secondary)', fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Headphones size={22} style={{ color: 'var(--primary)' }} />
              Need Booking Support?
            </h2>
            <p>
              For assistance with booking cancellations, travel updates or refund enquiries, please contact the Viji Drop Taxi booking team.
            </p>
          </section>

          {/* Contact Section */}
          <section style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ color: 'var(--secondary)', fontSize: '1.25rem', marginBottom: '0.75rem' }}>
              Contact Us
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              If you have any questions regarding this Cancellation Policy or need help with your booking, please contact us:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} style={{ color: 'var(--primary)' }} />
                <strong>Email:</strong> <a href="mailto:vijayakumarr782@gmail.com" style={{ color: 'var(--primary)' }}>vijayakumarr782@gmail.com</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} style={{ color: 'var(--primary)' }} />
                <strong>Phone:</strong> <a href="tel:+916382882740" style={{ color: 'var(--primary)' }}>+91 6382882740</a>
              </div>
            </div>
          </section>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/" className="btn btn-outline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
