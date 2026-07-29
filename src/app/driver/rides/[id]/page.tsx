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
  const handleCompleteRide = async () => {
    if (!confirm('Are you sure you want to complete this ride and collect payment?')) return;
    
    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch(`/api/driver/rides/${rideId}/complete`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete ride.');
      }

      fetchRideDetails();
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
                onClick={handleCompleteRide}
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
              <h3 style={{ color: 'var(--secondary)' }}>Ride Completed Successfully</h3>
              <p style={{ marginTop: '0.5rem' }}>Payment of ₹{ride.total_fare} has been recorded as COLLECTED ({ride.payment_mode || 'cash'}).</p>
              <Link href="/driver/dashboard" className="btn btn-outline btn-sm" style={{ marginTop: '1.5rem' }}>
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
    </div>
  );
}
