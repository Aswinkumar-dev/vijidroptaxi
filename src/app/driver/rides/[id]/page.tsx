'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, User, Phone, MapPin, Calendar, Clock, Lock, Key, ArrowLeft, RefreshCw, Car } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DriverRideControl({ params }: PageProps) {
  const { id: rideId } = use(params);
  const router = useRouter();
  
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'cash' | 'upi'>('cash');
  
  const fetchRideDetails = async () => {
    try {
      setErrorMsg('');
      const response = await fetch(`/api/rides/${rideId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch ride information.');
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
        router.push('/driver/login');
      } else {
        fetchRideDetails();
      }
    });

    // Supabase Realtime Subscription to sync driver screen
    const channel = supabase
      .channel(`driver-ride-sync-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`,
        },
        () => {
          fetchRideDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  // Transition 1: Arrived
  const handleArrived = async () => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch(`/api/driver/rides/${rideId}/arrived`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set status to arrived.');
      }

      fetchRideDetails();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Transition 2: Start Ride (No OTP)
  const handleStartRide = async () => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch(`/api/driver/rides/${rideId}/start`, {
        method: 'POST',
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start ride.');
      }

      fetchRideDetails();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start ride.');
    } finally {
      setSubmitting(false);
    }
  };

  // Transition 3: Complete Ride
  const handleCompleteRide = async (paymentMode: 'cash' | 'upi') => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch(`/api/driver/rides/${rideId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_mode: paymentMode }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete ride.');
      }

      fetchRideDetails();
      setShowPaymentModal(false);
      alert('Ride completed and payment logged successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error completing ride.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
        <RefreshCw className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem auto' }} size={32} />
        <div style={{ color: 'var(--text-muted)' }}>Loading ride...</div>
      </div>
    );
  }

  if (errorMsg && !ride) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ color: 'var(--error)', marginBottom: '1rem' }}>Access Error</h2>
          <p style={{ marginBottom: '2rem' }}>{errorMsg}</p>
          <Link href="/driver/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 0', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '650px' }}>
        
        <button onClick={() => router.push('/driver/dashboard')} className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <ArrowLeft size={16} /> Driver Console
        </button>

        {errorMsg && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Live Controls Card */}
        <div className="card" style={{ marginBottom: '1.5rem', borderTop: '6px solid var(--secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Ride Status Panel
            </span>
            <span className={`badge badge-${ride.status}`}>{ride.status.replace('_', ' ')}</span>
          </div>

          <h2 style={{ fontSize: '1.5rem', color: 'var(--secondary)', marginBottom: '1.5rem' }}>
            {ride.status === 'confirmed' && 'Action Required: Drive to Pickup'}
            {ride.status === 'driver_arrived' && 'Action Required: Start Trip'}
            {ride.status === 'ongoing' && 'Action Required: In Progress'}
            {ride.status === 'completed' && 'Ride Finished'}
          </h2>

          {/* Interactive Button States */}
          
          {/* Confirmed state: Driver has arrived button */}
          {ride.status === 'confirmed' && (
            <button
              onClick={handleArrived}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', padding: '1.25rem' }}
              disabled={submitting}
            >
              {submitting ? 'Updating status...' : "I've Arrived at Pickup Location"}
            </button>
          )}

          {/* Driver Arrived state: Start Trip action (no OTP) */}
          {ride.status === 'driver_arrived' && (
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--secondary)' }}>
                <Car size={18} style={{ color: 'var(--primary)' }} />
                <strong style={{ fontSize: '0.95rem' }}>Start Trip Confirmation</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Please confirm you have met the passenger and are ready to start the trip.
              </p>
              <button
                onClick={handleStartRide}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={submitting}
              >
                {submitting ? 'Starting Ride...' : 'Start Trip'}
              </button>
            </div>
          )}

          {/* Ongoing state: Complete Ride button */}
          {ride.status === 'ongoing' && (
            <div>
              <div style={{ backgroundColor: 'rgba(249, 115, 22, 0.05)', border: '1px dashed var(--primary)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.5rem', textAlign: 'center', color: 'var(--secondary)', fontWeight: 600 }}>
                🚕 Ride is active. Drop the passenger at their destination.
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn btn-success btn-lg"
                style={{ width: '100%', backgroundColor: 'var(--success)', color: 'white', padding: '1.25rem' }}
                disabled={submitting}
              >
                {submitting ? 'Completing Ride...' : 'Complete Ride & Collect Payment'}
              </button>
            </div>
          )}

          {/* Completed state summary */}
          {ride.status === 'completed' && (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--success)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                marginBottom: '1rem'
              }}>
                <ShieldCheck size={32} />
              </div>
              <h3 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>Ride Completed Successfully</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Payment of ₹{ride.total_fare} has been recorded as COLLECTED ({ride.payment_mode || 'cash'}).
              </p>

              {/* Review Collection Section */}
              <div style={{ backgroundColor: '#FAF5FF', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginTop: '1.5rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                <h4 style={{ color: 'var(--secondary)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  ⭐ Customer Rating & Feedback
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Ask the passenger to rate their ride experience and submit feedback.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <a
                    href={`https://wa.me/${(ride.customer_phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Thanks for riding with Viji Drop Taxi! Please rate your ride experience and driver here: ${window.location.origin}/rate/${ride.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem', fontSize: '0.88rem' }}
                  >
                    Share Review Link via WhatsApp
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/rate/${ride.id}`);
                      alert('Review link copied to clipboard!');
                    }}
                    className="btn btn-outline"
                    style={{ padding: '0.6rem', fontSize: '0.88rem' }}
                  >
                    Copy Review Link
                  </button>
                </div>
              </div>

              <Link href="/driver/dashboard" className="btn btn-outline btn-sm" style={{ width: '100%', padding: '0.6rem', fontSize: '0.88rem' }}>
                Go to Active Board
              </Link>
            </div>
          )}

        </div>

        {/* Customer Information Card */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} style={{ color: 'var(--primary)' }} /> Customer Contact
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '1.1rem' }}>
              {ride.customer_name || ride.customer?.full_name || 'Guest Passenger'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
              <Phone size={15} style={{ color: 'var(--text-muted)' }} />
              <a href={`tel:${ride.customer_phone || ride.customer?.phone}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>
                {ride.customer_phone || ride.customer?.phone || 'N/A'}
              </a>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#FAF5FF', marginTop: '0.25rem' }}>
              ℹ️ Passenger can call you directly, or share address details.
            </div>
          </div>
        </div>

        {/* Ride Details Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            Ride Route details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <MapPin size={16} style={{ color: 'var(--primary)', marginTop: '0.2rem' }} />
              <span style={{ fontSize: '0.85rem' }}><strong>Pickup:</strong> {ride.pickup_address}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <MapPin size={16} style={{ color: 'var(--success)', marginTop: '0.2,rem' }} />
              <span style={{ fontSize: '0.85rem' }}><strong>Drop:</strong> {ride.drop_address}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Distance</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--secondary)' }}>{ride.distance_km} KM</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Passenger Fare</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>₹{ride.total_fare}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Scheduled Time</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--secondary)' }}>
                  {new Date(ride.scheduled_at).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Payment Mode</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--secondary)', textTransform: 'uppercase' }}>
                  {ride.payment_mode?.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: 'var(--radius-md)',
            maxWidth: '400px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ color: 'var(--secondary)', marginBottom: '1rem', textAlign: 'center' }}>Select Payment Method</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
              Select how the passenger paid for this ride:
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setSelectedPaymentMode('cash')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: selectedPaymentMode === 'cash' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: selectedPaymentMode === 'cash' ? 'rgba(249, 115, 22, 0.05)' : 'white',
                  color: 'var(--secondary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                💵 Cash
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaymentMode('upi')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: selectedPaymentMode === 'upi' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: selectedPaymentMode === 'upi' ? 'rgba(249, 115, 22, 0.05)' : 'white',
                  color: 'var(--secondary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                📱 UPI
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1, border: '1px solid var(--border-color)' }}
                onClick={() => setShowPaymentModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                style={{ flex: 2, backgroundColor: 'var(--success)', color: 'white' }}
                onClick={() => handleCompleteRide(selectedPaymentMode)}
                disabled={submitting}
              >
                {submitting ? 'Completing...' : 'Confirm & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
