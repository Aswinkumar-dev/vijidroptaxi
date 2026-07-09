'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, MapPin, ArrowRight, ClipboardList } from 'lucide-react';

export default function RidesHistory() {
  const router = useRouter();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login?msg=Please log in to view your rides');
      } else {
        fetchRides(user.id);
      }
    });
  }, []);

  const fetchRides = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('customer_id', userId)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      setRides(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch rides.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    return `badge badge-${status}`;
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ padding: '3rem 0', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: 'var(--secondary)' }}>My Ride History</h1>
            <p>View your upcoming trips and past drop taxi bills</p>
          </div>
          <Link href="/book" className="btn btn-primary">
            Book New Ride
          </Link>
        </div>

        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ color: 'var(--text-muted)' }}>Loading your rides...</div>
          </div>
        ) : rides.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <ClipboardList size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>No Rides Booked Yet</h3>
            <p style={{ marginBottom: '1.5rem' }}>You haven't scheduled any rides with Viji Drop Taxi.</p>
            <Link href="/book" className="btn btn-primary">
              Book Your First Trip
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {rides.map(ride => (
              <div key={ride.id} className="card card-hover" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '0.9rem' }}>
                      {formatDateTime(ride.scheduled_at)}
                    </span>
                  </div>
                  <span className={getStatusBadgeClass(ride.status)}>
                    {ride.status.replace('_', ' ')}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '1rem' }} className="grid-2">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <MapPin size={16} style={{ color: 'var(--primary)', marginTop: '0.2rem' }} />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pickup</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)' }}>{ride.pickup_address}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <MapPin size={16} style={{ color: 'var(--success)', marginTop: '0.2rem' }} />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Drop</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)' }}>{ride.drop_address}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fare Estimate: </span>
                    <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>₹{ride.total_fare}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({ride.distance_km} KM)</span>
                  </div>
                  <Link href={`/rides/${ride.id}`} className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    Track Ride <ArrowRight size={14} />
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
