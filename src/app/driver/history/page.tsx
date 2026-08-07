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

  // Date Filtering State (strictly starting from August 2026)
  const [selectedDate, setSelectedDate] = useState<string>(''); // empty string means "All Dates"
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter rides based on selectedDate (August 2026 onwards)
  const filteredRides = React.useMemo(() => {
    return rides.filter(ride => {
      const dateStr = ride.completed_at || ride.scheduled_at;
      if (!dateStr) return false;
      const rideDate = new Date(dateStr);
      if (isNaN(rideDate.getTime())) return false;
      
      const year = rideDate.getFullYear();
      const month = String(rideDate.getMonth() + 1).padStart(2, '0');
      const ym = `${year}-${month}`;
      
      // Enforce the starting point constraint: August 2026 or later
      if (ym < '2026-08') return false;

      // Calendar Date filter (Format: YYYY-MM-DD)
      if (selectedDate !== '') {
        const rideDateStr = `${year}-${month}-${String(rideDate.getDate()).padStart(2, '0')}`;
        if (rideDateStr !== selectedDate) return false;
      }
      
      return true;
    });
  }, [rides, selectedDate]);

  // Paginated rides
  const recordsPerPage = 10;
  const totalPages = Math.ceil(filteredRides.length / recordsPerPage);
  const activePage = Math.min(currentPage, totalPages || 1);
  const indexOfLastRecord = activePage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRides.slice(indexOfFirstRecord, indexOfLastRecord);

  // Helper for generating page numbers with ellipses
  const getPageNumbers = (current: number, total: number) => {
    const pages: (number | string)[] = [];
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        if (pages[pages.length - 1] !== i) {
          pages.push(i);
        }
      }
      
      if (current < total - 2) pages.push('...');
      if (total > 1 && pages[pages.length - 1] !== total) pages.push(total);
    }
    return pages;
  };

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

      if (driverErr && driverErr.code !== 'PGRST116') {
        throw driverErr;
      }

      if (!driver) {
        // Driver is not linked yet
        setRides([]);
        setEarnings(0);
        setLoading(false);
        return;
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

        {/* Date Filter Panel */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', backgroundColor: 'var(--card-color)' }}>
          <div style={{ flex: '1', minWidth: '240px' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--secondary)' }}>
              Select Date (August 2026 onwards)
            </label>
            <input
              type="date"
              className="form-control"
              min="2026-08-01"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-color)', fontSize: '0.9rem', color: 'var(--secondary)' }}
            />
          </div>

          <button
            onClick={() => {
              setSelectedDate('');
              setCurrentPage(1);
            }}
            className="btn btn-ghost btn-sm"
            style={{ border: '1px solid var(--border-color)', height: '40px', padding: '0 1rem', display: 'flex', alignItems: 'center' }}
          >
            Show All Dates
          </button>
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
        ) : filteredRides.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p>No completed rides found for the selected date filters.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentRecords.map((ride) => (
                <div key={ride.id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span>Completed: {ride.completed_at ? new Date(ride.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>₹{ride.total_fare} ({ride.payment_mode || 'cash'})</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                    <div><strong>Customer:</strong> {ride.customer_name || ride.customer?.full_name || 'Guest Passenger'}</div>
                    <div><strong>Pickup:</strong> {ride.pickup_address}</div>
                    <div><strong>Drop:</strong> {ride.drop_address}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Trip Distance: {ride.distance_km} KM | Car Type: {ride.car_type.toUpperCase()}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', padding: '1rem 0', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredRides.length)} of {filteredRides.length} records
                </span>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={activePage === 1}
                    className="btn btn-ghost btn-sm"
                    style={{ border: '1px solid var(--border-color)', opacity: activePage === 1 ? 0.5 : 1, cursor: activePage === 1 ? 'not-allowed' : 'pointer', height: '36px', display: 'flex', alignItems: 'center' }}
                  >
                    Previous
                  </button>
                  
                  {getPageNumbers(activePage, totalPages).map((pageNum, idx) => {
                    if (pageNum === '...') {
                      return <span key={`ellipsis-${idx}`} style={{ padding: '0 0.5rem', color: 'var(--text-muted)' }}>...</span>;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum as number)}
                        className={`btn btn-sm ${activePage === pageNum ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ 
                          minWidth: '36px', 
                          height: '36px', 
                          padding: '0', 
                          border: activePage === pageNum ? 'none' : '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={activePage === totalPages}
                    className="btn btn-ghost btn-sm"
                    style={{ border: '1px solid var(--border-color)', opacity: activePage === totalPages ? 0.5 : 1, cursor: activePage === totalPages ? 'not-allowed' : 'pointer', height: '36px', display: 'flex', alignItems: 'center' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
