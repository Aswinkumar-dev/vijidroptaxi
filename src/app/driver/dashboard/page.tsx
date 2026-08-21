'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RefreshCw, MapPin, Calendar, Clock, ArrowRight, DollarSign, Award, QrCode } from 'lucide-react';
import dynamic from 'next/dynamic';

const DriverQRCode = dynamic(() => import('@/components/DriverQRCode'), { ssr: false });

// ─── Module-level client cache ───────────────────────────────────────────────
// These survive React unmount/remount during SPA navigation within the same
// browser session, so navigating back to this page shows data instantly.
let _cachedRides: any[] | null = null;
let _cachedDriver: any | null = null;
let _cacheTs = 0;
const CACHE_TTL = 30_000; // 30 seconds

export default function DriverDashboard() {
  const router = useRouter();
  
  // Initialise state from cache — page renders immediately if cache is warm
  const isCacheWarm = _cachedDriver !== null && Date.now() - _cacheTs < CACHE_TTL;
  const [rides, setRides] = useState<any[]>(isCacheWarm ? _cachedRides! : []);
  const [driver, setDriver] = useState<any>(isCacheWarm ? _cachedDriver : null);
  const [loading, setLoading] = useState(!isCacheWarm);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDriverDashboardData = async (silent = false) => {
    try {
      if (!silent) {
        // If we have stale cache, show data immediately and refresh in background
        if (_cachedDriver) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      }
      setErrorMsg('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/driver/login');
        return;
      }

      const profileResponse = await fetch('/api/driver/profile');
      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileData.error || 'Failed to fetch driver profile.');
      }

      const { driver: driverData, profile } = profileData;

      if (driverData) {
        const driverWithProfile = { ...driverData, profile };

        const ridesResponse = await fetch('/api/driver/rides');
        const data = await ridesResponse.json();

        if (!ridesResponse.ok) {
          throw new Error(data.error || 'Failed to fetch assigned rides.');
        }

        const freshRides = data || [];

        // Update cache
        _cachedDriver = driverWithProfile;
        _cachedRides = freshRides;
        _cacheTs = Date.now();

        setDriver(driverWithProfile);
        setRides(freshRides);
      } else {
        const fallback = {
          profile,
          car: null,
          is_not_linked: true,
          total_rides: 0,
          rating_avg: '—',
        };
        _cachedDriver = fallback;
        _cachedRides = [];
        _cacheTs = Date.now();

        setDriver(fallback);
        setRides([]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const isStale = !_cachedDriver || Date.now() - _cacheTs >= CACHE_TTL;
    if (isStale) {
      fetchDriverDashboardData();
    } else {
      // Cache is warm — show stale data instantly, revalidate silently
      setDriver(_cachedDriver);
      setRides(_cachedRides!);
      setLoading(false);
      fetchDriverDashboardData(true); // silent background refresh
    }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: 'var(--secondary)' }}>
              Welcome, {driver?.profile?.full_name?.split(' ')[0] || 'Driver'} 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {driver?.car
                ? `Driving: ${driver.car.color} ${driver.car.brand} ${driver.car.model} • ${driver.car.registration_number}`
                : 'No vehicle assigned yet'}
            </p>
          </div>
          <button
            onClick={() => fetchDriverDashboardData()}
            className="btn btn-ghost btn-sm"
            style={{ border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--accent)', fontSize: '1.75rem', fontWeight: 800 }}>{driver.rating_avg} ★</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Avg Rating</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--primary)', fontSize: '1.75rem', fontWeight: 800 }}>{driver.total_rides || 0}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Total Rides</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--success)', fontSize: '1.75rem', fontWeight: 800 }}>{rides.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Active Rides</div>
          </div>
        </div>

        {driver.is_not_linked && (
          <div className="alert" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: 'var(--secondary)', marginBottom: '2rem' }}>
            <strong>Account Pending Setup:</strong> Your driver profile isn&apos;t linked to a driver record yet. Please contact the administrator to complete your onboarding.
          </div>
        )}

        {/* Active Rides */}
        <h2 style={{ fontSize: '1.3rem', color: 'var(--secondary)', marginBottom: '1.25rem' }}>Active Assignments</h2>

        {rides.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
            <h3 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>No Active Rides</h3>
            <p>You have no current assigned bookings to fulfill. Check back when the administrator schedules a run.</p>
            <button onClick={() => fetchDriverDashboardData()} className="btn btn-outline btn-sm" style={{ marginTop: '1.5rem' }}>
              <RefreshCw size={14} style={{ marginRight: '0.25rem' }} /> Refresh Dashboard
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {rides.map(ride => (
              <div key={ride.id} className="card card-hover" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '1rem', marginBottom: '0.25rem' }}>
                      {ride.customer?.full_name || ride.customer_name || 'Guest Customer'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {ride.customer?.phone || ride.customer_phone || '—'}
                    </div>
                  </div>
                  {getStatusBadge(ride.status)}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.88rem' }}>
                    <MapPin size={15} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: 'var(--text-muted)' }}><strong>From:</strong> {ride.pickup_address}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.88rem' }}>
                    <MapPin size={15} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: 'var(--text-muted)' }}><strong>To:</strong> {ride.drop_address}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={13} /> {new Date(ride.scheduled_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={13} /> {new Date(ride.scheduled_at).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                  </div>
                  {ride.total_fare && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <DollarSign size={13} /> ₹{ride.total_fare}
                    </div>
                  )}
                  {ride.distance_km > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Award size={13} /> {ride.distance_km} km
                    </div>
                  )}
                </div>

                <Link
                  href={`/driver/rides/${ride.id}`}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  Manage Ride <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* QR Code Card for Review Collection */}
        {driver && driver.id && !driver.is_not_linked && (
          <div className="card" style={{ marginTop: '2.5rem', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={18} style={{ color: 'var(--primary)' }} /> Your Customer Review QR Code
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '450px', lineHeight: 1.6 }}>
                Print this unique QR code and place it inside your vehicle. Customers can scan it to leave a review & rating directly for you.
              </p>
              <DriverQRCode driverId={driver.id} driverName={driver?.profile?.full_name} size={200} showActions={true} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
