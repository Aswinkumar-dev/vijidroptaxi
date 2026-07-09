'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RefreshCw, MapPin, Calendar, Clock, ArrowRight, DollarSign, Award } from 'lucide-react';

export default function DriverDashboard() {
  const router = useRouter();
  
  const [rides, setRides] = useState<any[]>([]);
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDriverDashboardData = async () => {
    try {
      setErrorMsg('');
      
      // 1. Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/driver/login');
        return;
      }

      // 2. Fetch driver profile data
      const { data: driverData, error: driverErr } = await supabase
        .from('drivers')
        .select(`
          *,
          profile:profiles(id, full_name, role),
          car:cars(*)
        `)
        .eq('profile_id', user.id)
        .single();

      if (driverErr || !driverData) {
        throw new Error('Driver profile details could not be found in profiles/drivers tables.');
      }

      setDriver(driverData);

      // 3. Fetch active rides
      const response = await fetch('/api/driver/rides');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch assigned rides.');
      }

      setRides(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverDashboardData();
  }, []);

  const getStatusBadge = (status: string) => {
    return <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
        <RefreshCw className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem auto' }} size={32} />
        <div style={{ color: 'var(--text-muted)' }}>Loading driver panel...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem 0', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* Header stats dashboard panel */}
        {driver && (
          <div className="card" style={{
            backgroundColor: 'var(--secondary)',
            color: 'white',
            marginBottom: '2rem',
            padding: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}>
            <div>
              <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Driver Console
              </span>
              <h1 style={{ color: 'white', fontSize: '1.75rem', marginTop: '0.25rem' }}>
                Welcome, {driver.profile?.full_name}!
              </h1>
              <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Vehicle: {driver.car ? `${driver.car.color} ${driver.car.brand} ${driver.car.model} (${driver.car.registration_number})` : 'No car linked'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '1.5rem' }}>
                <div style={{ color: 'var(--accent)', fontSize: '1.75rem', fontWeight: 800 }}>{driver.total_rides || 0}</div>
                <div style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total Rides</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--accent)', fontSize: '1.75rem', fontWeight: 800 }}>{driver.rating_avg} ★</div>
                <div style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Rating</div>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        <h2 style={{ fontSize: '1.35rem', color: 'var(--secondary)', marginBottom: '1.25rem' }}>Active & Assigned Bookings</h2>

        {rides.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
            <h3 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>No Active Rides</h3>
            <p>You have no current assigned bookings to fulfill. Check back when the administrator schedules a run.</p>
            <button onClick={fetchDriverDashboardData} className="btn btn-outline btn-sm" style={{ marginTop: '1.5rem' }}>
              <RefreshCw size={14} style={{ marginRight: '0.25rem' }} /> Refresh Dashboard
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {rides.map(ride => (
              <div key={ride.id} className="card card-hover" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={15} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary)' }}>
                      {new Date(ride.scheduled_at).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {getStatusBadge(ride.status)}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Passenger: </span>
                    <strong style={{ color: 'var(--secondary)' }}>{ride.customer?.full_name}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>Phone: </span>
                    <a href={`tel:${ride.customer?.phone}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{ride.customer?.phone}</a>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginTop: '0.5rem' }} className="grid-2">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                      <MapPin size={15} style={{ color: 'var(--primary)', marginTop: '0.25rem' }} />
                      <span style={{ fontSize: '0.85rem' }}><strong>Pickup:</strong> {ride.pickup_address}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                      <MapPin size={15} style={{ color: 'var(--success)', marginTop: '0.25rem' }} />
                      <span style={{ fontSize: '0.85rem' }}><strong>Drop:</strong> {ride.drop_address}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Class: </span>
                    <strong style={{ textTransform: 'capitalize', color: 'var(--secondary)' }}>{ride.car_type}</strong>
                    <span style={{ margin: '0 0.5rem', color: 'var(--border-color)' }}>|</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fare: </span>
                    <strong style={{ color: 'var(--primary)' }}>₹{ride.total_fare}</strong>
                  </div>
                  
                  <Link href={`/driver/rides/${ride.id}`} className="btn btn-secondary btn-sm">
                    Manage Ride Controls <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
