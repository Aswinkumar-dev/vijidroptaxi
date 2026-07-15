'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Phone, User, Home, Car } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'Customer';
  const phone = searchParams.get('phone') || '';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '3rem 1.5rem',
      backgroundColor: 'var(--bg-color)',
    }}>
      <div className="card" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '3rem 2.5rem',
        textAlign: 'center',
        boxShadow: '0 0 40px rgba(16, 185, 129, 0.12)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
      }}>
        {/* Success Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <CheckCircle size={44} style={{ color: 'var(--success)' }} />
        </div>

        <h2 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>Booking Confirmed!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Your ride has been successfully booked. Our team will contact you shortly to confirm the driver details.
        </p>

        {/* Passenger Info */}
        <div style={{
          backgroundColor: 'rgba(249, 115, 22, 0.05)',
          border: '1px solid rgba(249, 115, 22, 0.15)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '2rem',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <User size={16} style={{ color: 'var(--primary)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Passenger</div>
              <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>{name}</div>
            </div>
          </div>
          {phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Phone size={16} style={{ color: 'var(--primary)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact Number</div>
                <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>{phone}</div>
              </div>
            </div>
          )}
        </div>

        {/* OTP Warning Banner */}
        <div style={{
          backgroundColor: 'rgba(249, 115, 22, 0.08)',
          border: '2px solid rgba(249, 115, 22, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1rem',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'var(--primary)',
            marginBottom: '0.4rem',
            letterSpacing: '-0.01em',
          }}>
            🚨 Do not close this page
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--secondary)', lineHeight: 1.65 }}>
            You will receive an OTP once your ride is confirmed. Please share it with your driver when they arrive.
          </p>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          📞 Our coordinator will call you on <strong>{phone}</strong> to confirm your pickup details.
        </p>


        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href="/book" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Car size={16} /> Book Another Ride
          </Link>
          <Link href="/" className="btn btn-outline" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Home size={16} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccess() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
