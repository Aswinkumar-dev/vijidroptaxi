'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RefreshCw, ClipboardList, Users, Car, HelpCircle, DollarSign, Star, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  
  const [stats, setStats] = useState({
    totalRides: 0,
    pendingRides: 0,
    activeRides: 0,
    completedRides: 0,
    totalDrivers: 0,
    totalCars: 0,
    avgRating: 4.8
  });
  
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // Authenticate
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }

      // Verify admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        router.push('/');
        return;
      }

      // Query database statistics (using client-side queries)
      const { count: totalRidesCount } = await supabase.from('rides').select('*', { count: 'exact', head: true });
      const { count: pendingCount } = await supabase.from('rides').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: activeCount } = await supabase.from('rides').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'driver_arrived', 'ongoing']);
      const { count: completedCount } = await supabase.from('rides').select('*', { count: 'exact', head: true }).eq('status', 'completed');
      
      const { count: driversCount } = await supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_active', true);
      const { count: carsCount } = await supabase.from('cars').select('*', { count: 'exact', head: true }).eq('is_active', true);

      // Fetch driver ratings avg
      const { data: driverRatings } = await supabase.from('drivers').select('rating_avg');
      let ratingAvg = 5.0;
      if (driverRatings && driverRatings.length > 0) {
        const sum = driverRatings.reduce((acc, curr) => acc + Number(curr.rating_avg || 0), 0);
        ratingAvg = parseFloat((sum / driverRatings.length).toFixed(1));
      }

      setStats({
        totalRides: totalRidesCount || 0,
        pendingRides: pendingCount || 0,
        activeRides: activeCount || 0,
        completedRides: completedCount || 0,
        totalDrivers: driversCount || 0,
        totalCars: carsCount || 0,
        avgRating: ratingAvg
      });

      // Fetch recent 5 rides
      const { data: recent, error: recentErr } = await supabase
        .from('rides')
        .select(`
          *,
          customer:profiles!rides_customer_id_fkey(id, full_name, phone)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentErr) throw recentErr;
      setRecentRides(recent || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div style={{ padding: '3rem 0', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
      <div className="container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: 'var(--secondary)' }}>Admin Dispatch Console</h1>
            <p>Monitor your 2-3 vehicle fleet and coordinate passenger dispatches</p>
          </div>
          <button onClick={fetchStats} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={16} /> Refresh Console
          </button>
        </div>

        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Unassigned</span>
              <ClipboardList size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.5rem' }}>{stats.pendingRides}</div>
            <Link href="/admin/bookings" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-block', marginTop: '0.25rem' }}>
              Assign Drivers →
            </Link>
          </div>

          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--info)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Active Rides</span>
              <RefreshCw size={20} style={{ color: 'var(--info)' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.5rem' }}>{stats.activeRides}</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-block', marginTop: '0.25rem' }}>In-progress trips</span>
          </div>

          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Active Fleet</span>
              <Car size={20} style={{ color: 'var(--success)' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.5rem' }}>{stats.totalCars} Cars</div>
            <Link href="/admin/cars" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-block', marginTop: '0.25rem' }}>
              Manage Cars →
            </Link>
          </div>

          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Active Drivers</span>
              <Users size={20} style={{ color: 'var(--secondary)' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.5rem' }}>{stats.totalDrivers}</div>
            <Link href="/admin/drivers" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-block', marginTop: '0.25rem' }}>
              Manage Drivers →
            </Link>
          </div>

        </div>

        {/* Dashboard Panels Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="grid-2">
          
          {/* Recent Rides Table */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary)' }}>Recent Bookings</h3>
              <Link href="/admin/bookings" className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                See All Bookings
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading recent rides...</div>
            ) : recentRides.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>No recent bookings placed.</p>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Passenger</th>
                      <th>Scheduled</th>
                      <th>Route</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRides.map(ride => (
                      <tr key={ride.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '0.85rem' }}>{ride.customer?.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ride.customer?.phone}</div>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>
                          {new Date(ride.scheduled_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} <br />
                          {new Date(ride.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ fontSize: '0.8rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div><strong>From:</strong> {ride.pickup_address}</div>
                          <div><strong>To:</strong> {ride.drop_address}</div>
                        </td>
                        <td>
                          <span className={`badge badge-${ride.status}`} style={{ fontSize: '0.65rem' }}>
                            {ride.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions & Config Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Quick Dispatch Controls
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link href="/admin/bookings" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
                  Manual Dispatch Board
                </Link>
                <Link href="/admin/pricing" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                  Edit Base & Per-KM Rates
                </Link>
                <Link href="/admin/reviews" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                  View Moderation Reviews
                </Link>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Fleet Scale Summary
              </h3>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                Your taxi company operates a small high-end fleet, optimized to scale up to 10 vehicles. All rides are manually dispatched by you.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ backgroundColor: '#FFF7ED', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Rating</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>{stats.avgRating} ★</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fleet Status</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.25rem' }}>Active</div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
