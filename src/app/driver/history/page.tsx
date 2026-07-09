'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Calendar, MapPin, DollarSign, Award } from 'lucide-react';

export default function DriverHistory() {
  const router = useRouter();
  
  const [rides, setRides] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/driver/login');
        return;
      }

      // Fetch driver ID
      const { data: driver, error: driverErr } = await supabase
        .from('drivers')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (driverErr || !driver) {
        throw new Error('Driver profile details not found.');
      }

      // Fetch completed rides for this driver
      const { data: completedRides, error: ridesErr } = await supabase
        .from('rides')
        .select(`
          *,
          customer:profiles!rides_customer_id_fkey(id, full_name, phone)
        `)
        .eq('driver_id', driver.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (ridesErr) throw ridesErr;
      setRides(completedRides || []);

      // Calculate total earnings
      const total = (completedRides || []).reduce((acc, curr) => acc + Number(curr.total_fare || 0), 0);
      setEarnings(total);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div style={{ padding: '3rem 0', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        <h1 style={{ fontSize: '2rem', color: 'var(--secondary)', marginBottom: '2rem' }}>Driver Trip History</h1>

        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Earning Stats panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2.5rem' }} className="grid-2">
          
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: '6px solid var(--primary)' }}>
            <div style={{
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--primary)'
            }}>
              <DollarSign size={32} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Earnings
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.25rem' }}>
                ₹{earnings.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: '6px solid var(--secondary)' }}>
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.05)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--secondary)'
            }}>
              <Award size={32} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Trips Completed
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.25rem' }}>
                {rides.length} Rides
              </div>
            </div>
          </div>

        </div>

        {/* List of rides completed */}
        <h2 style={{ fontSize: '1.25rem', color: 'var(--secondary)', marginBottom: '1rem' }}>Completed Jobs Log</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ color: 'var(--text-muted)' }}>Loading history log...</div>
          </div>
        ) : rides.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p>You have not completed any rides yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {rides.map((ride) => (
              <div key={ride.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span>Completed: {ride.completed_at ? new Date(ride.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>₹{ride.total_fare} ({ride.payment_mode || 'cash'})</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                  <div><strong>Customer:</strong> {ride.customer?.full_name}</div>
                  <div><strong>Pickup:</strong> {ride.pickup_address}</div>
                  <div><strong>Drop:</strong> {ride.drop_address}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Trip Distance: {ride.distance_km} KM | Car Type: {ride.car_type.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
