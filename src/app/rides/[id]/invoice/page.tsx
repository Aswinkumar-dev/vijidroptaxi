'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Receipt, Printer, ArrowLeft, Check, Sparkles } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RideInvoice({ params }: PageProps) {
  const { id: rideId } = use(params);
  const router = useRouter();
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRideDetails = async () => {
    try {
      const response = await fetch(`/api/rides/${rideId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invoice details');
      }

      setRide(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        fetchRideDetails();
      }
    });
  }, [rideId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading invoice...</div>
      </div>
    );
  }

  if (errorMsg || !ride) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ color: 'var(--error)', marginBottom: '1rem' }}>Invoice Error</h2>
          <p style={{ marginBottom: '2rem' }}>{errorMsg || 'Invoice could not be loaded.'}</p>
          <Link href="/rides" className="btn btn-primary">
            Back to My Rides
          </Link>
        </div>
      </div>
    );
  }

  // Breakdown calculations
  const total = Number(ride.total_fare || 0);
  const base = Number(ride.base_fare || 0);
  const allowance = (ride.ride_type === 'round_trip' && ride.car_type === 'suv') ? 300 : (ride.ride_type === 'round_trip') ? 250 : 0;
  const distanceCharge = Math.max(0, total - base - allowance);

  return (
    <div style={{ padding: '3rem 0', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }} className="print-area">
      <div className="container" style={{ maxWidth: '650px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }} className="no-print">
          <button onClick={() => router.push(`/rides/${rideId}`)} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={16} /> Back to Ride status
          </button>
          <button onClick={handlePrint} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Printer size={16} /> Print Receipt
          </button>
        </div>

        <div className="receipt-box" style={{ borderTop: '6px solid var(--primary)' }}>
          
          <div className="receipt-header">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <img src="/assets/viji drop taxi logo.png" alt="Viji Drop Taxi" style={{ height: '48px', width: 'auto' }} />
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary)', fontFamily: 'var(--font-primary)' }}>
                Viji Drop Taxi
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Coimbatore, Tamil Nadu, India</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Invoice ID: #{ride.id.slice(0, 8).toUpperCase()}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-color)', borderBottom: '1px dashed var(--border-color)', paddingBottom: '1rem' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billed To</div>
              <div style={{ fontWeight: 700, marginTop: '0.25rem' }}>{ride.customer?.full_name}</div>
              <div style={{ color: 'var(--text-muted)' }}>{ride.customer?.phone}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Date</div>
              <div style={{ fontWeight: 700, marginTop: '0.25rem' }}>
                {ride.completed_at ? new Date(ride.completed_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'N/A'}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontWeight: 700, marginTop: '0.25rem' }}>
                <Check size={14} /> PAID ({ride.payment_mode?.toUpperCase()})
              </div>
            </div>
          </div>

          {/* Route details */}
          <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Trip Route Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div><strong>From:</strong> {ride.pickup_address}</div>
              <div><strong>To:</strong> {ride.drop_address}</div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Vehicle: {ride.car?.color} {ride.car?.brand} {ride.car?.model} ({ride.car?.registration_number})
              </div>
            </div>
          </div>

          {/* Charge details */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Charge Summary</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div className="receipt-row">
                <span>Base Taxi Fare</span>
                <span>₹{base.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>Distance Ride Fare ({ride.distance_km} KM)</span>
                <span>₹{distanceCharge.toFixed(2)}</span>
              </div>
              {allowance > 0 && (
                <div className="receipt-row">
                  <span>Driver Outstation Allowance</span>
                  <span>₹{allowance.toFixed(2)}</span>
                </div>
              )}

              <div className="receipt-row receipt-row-bold" style={{ fontSize: '1.25rem' }}>
                <span>Total Amount Paid</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.25rem' }}>
              <Sparkles size={16} /> Thank you for riding with Viji Drop Taxi!
            </div>
            <div>For assistance, please contact +91 98765 43210.</div>
          </div>

        </div>

      </div>

      {/* Extra styles specifically for printing */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-area {
            padding: 0 !important;
            background-color: white !important;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
          .receipt-box {
            box-shadow: none !important;
            border: 1px solid #E2E8F0 !important;
            padding: 1.5in !important;
          }
        }
      `}</style>
    </div>
  );
}
