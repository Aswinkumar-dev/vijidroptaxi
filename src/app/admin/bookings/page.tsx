'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RefreshCw, MapPin, Calendar, Clock, User, Car, Tag, Check, X, ShieldAlert, Plus } from 'lucide-react';

export default function AdminBookings() {
  const router = useRouter();

  const [bookings, setBookings] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Date Filtering State (strictly starting from August 2026)
  const [selectedDate, setSelectedDate] = useState<string>(''); // empty string means "All Dates"
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter bookings based on selectedDate (only August 2026 onwards)
  const filteredBookings = React.useMemo(() => {
    return bookings.filter(ride => {
      if (!ride.scheduled_at) return false;
      const rideDate = new Date(ride.scheduled_at);
      if (isNaN(rideDate.getTime())) return false;
      
      const year = rideDate.getFullYear();
      const month = String(rideDate.getMonth() + 1).padStart(2, '0');
      const ym = `${year}-${month}`;
      
      // Enforce the starting point constraint: strictly August 2026 or later
      if (ym < '2026-08') return false;

      // Calendar Date filter (Format: YYYY-MM-DD)
      if (selectedDate !== '') {
        const rideDateStr = `${year}-${month}-${String(rideDate.getDate()).padStart(2, '0')}`;
        if (rideDateStr !== selectedDate) return false;
      }
      
      return true;
    });
  }, [bookings, selectedDate]);

  // Paginated bookings
  const recordsPerPage = 10;
  const totalPages = Math.ceil(filteredBookings.length / recordsPerPage);
  const activePage = Math.min(currentPage, totalPages || 1);
  const indexOfLastRecord = activePage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredBookings.slice(indexOfFirstRecord, indexOfLastRecord);

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
  
  // Assignment Modal State
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [driverId, setDriverId] = useState('');
  const [carId, setCarId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [paymentModeSelect, setPaymentModeSelect] = useState('cash');

  // Create Manual Booking Modal State
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newRideType, setNewRideType] = useState<'one_way' | 'round_trip'>('one_way');
  const [newPickupAddress, setNewPickupAddress] = useState('');
  const [newDropAddress, setNewDropAddress] = useState('');
  const [newScheduledDate, setNewScheduledDate] = useState('');
  const [newScheduledTime, setNewScheduledTime] = useState('');
  const [newReturnDate, setNewReturnDate] = useState('');
  const [newReturnTime, setNewReturnTime] = useState('');
  const [newCarType, setNewCarType] = useState<'sedan' | 'suv' | 'innova'>('sedan');
  const [newDistanceKm, setNewDistanceKm] = useState('');
  const [newTotalFare, setNewTotalFare] = useState('');
  const [newPaymentMode, setNewPaymentMode] = useState<'cash' | 'upi'>('cash');

  const fetchData = async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      setErrorMsg('');

      // Authenticate & Verify admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        router.push('/');
        return;
      }

      // Fetch all bookings using server-side API (bypassing client-side RLS)
      const res = await fetch('/api/admin/rides');
      const ridesData = await res.json();

      if (!res.ok) {
        throw new Error(ridesData.error || 'Failed to fetch bookings.');
      }
      setBookings(ridesData || []);

      // Fetch drivers using server-side API (bypassing client-side RLS)
      const driversRes = await fetch('/api/admin/drivers');
      const driversJson = await driversRes.json();
      if (!driversRes.ok) {
        throw new Error(driversJson.error || 'Failed to fetch drivers.');
      }
      const activeDrivers = (driversJson.drivers || []).filter((d: any) => d.is_active);
      setDrivers(activeDrivers);

      // Fetch vehicles using server-side API (bypassing client-side RLS)
      const carsRes = await fetch('/api/admin/cars');
      const carsJson = await carsRes.json();
      if (!carsRes.ok) {
        throw new Error(carsJson.error || 'Failed to fetch vehicles.');
      }
      const activeCars = (carsJson.cars || []).filter((c: any) => c.is_active);
      setCars(activeCars);

    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred fetching bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh bookings quietly in the background every 20 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const openAssignModal = (ride: any) => {
    setSelectedRide(ride);
    setPaymentModeSelect(ride.payment_mode || 'cash');
    
    // Attempt to auto-prefill based on requested car type
    const matchingCars = cars.filter(c => c.car_type === ride.car_type);
    if (matchingCars.length > 0) {
      setCarId(matchingCars[0].id);
      
      // Auto-prefill matching driver if linked to this car
      const linkedDriver = drivers.find(d => d.current_car_id === matchingCars[0].id);
      if (linkedDriver) {
        setDriverId(linkedDriver.id);
      } else if (drivers.length > 0) {
        setDriverId(drivers[0].id);
      }
    } else {
      if (cars.length > 0) setCarId(cars[0].id);
      if (drivers.length > 0) setDriverId(drivers[0].id);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId || !carId || !selectedRide) return;

    setAssigning(true);
    setErrorMsg('');

    try {
      const response = await fetch(`/api/admin/rides/${selectedRide.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          driver_id: driverId, 
          car_id: carId,
          payment_mode: paymentModeSelect
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign driver.');
      }

      setSelectedRide(null);
      fetchData();
      alert('Driver assigned successfully! Customer notified.');
    } catch (err: any) {
      alert(err.message || 'Error occurred during assignment.');
    } finally {
      setAssigning(false);
    }
  };

  const handleCancelBooking = async (rideId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      const response = await fetch(`/api/admin/rides/${rideId}/cancel`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking.');
      }

      fetchData();
      alert('Booking cancelled successfully.');
    } catch (err: any) {
      alert(err.message || 'Error cancelling booking.');
    }
  };

  const handleCreateBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerPhone || !newPickupAddress || !newDropAddress || !newScheduledDate || !newScheduledTime || !newTotalFare) {
      alert('Please fill in all required fields.');
      return;
    }

    setAssigning(true);
    setErrorMsg('');

    try {
      const scheduledAt = new Date(`${newScheduledDate}T${newScheduledTime}`).toISOString();
      let returnScheduledAt = null;
      if (newRideType === 'round_trip' && newReturnDate && newReturnTime) {
        returnScheduledAt = new Date(`${newReturnDate}T${newReturnTime}`).toISOString();
      }

      const response = await fetch('/api/admin/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: newCustomerName ? newCustomerName.trim() : 'Guest',
          customer_phone: newCustomerPhone.trim(),
          ride_type: newRideType,
          pickup_address: newPickupAddress.trim(),
          drop_address: newDropAddress.trim(),
          scheduled_at: scheduledAt,
          return_scheduled_at: returnScheduledAt,
          car_type: newCarType,
          distance_km: newDistanceKm,
          total_fare: newTotalFare,
          payment_mode: newPaymentMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create manual booking.');
      }

      setShowAddBookingModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewRideType('one_way');
      setNewPickupAddress('');
      setNewDropAddress('');
      setNewScheduledDate('');
      setNewScheduledTime('');
      setNewReturnDate('');
      setNewReturnTime('');
      setNewCarType('sedan');
      setNewDistanceKm('');
      setNewTotalFare('');
      setNewPaymentMode('cash');

      fetchData();
      alert('Manual booking created successfully!');
    } catch (err: any) {
      alert(err.message || 'Error occurred creating booking.');
    } finally {
      setAssigning(false);
    }
  };

  // Filter cars based on requested ride car type
  const getFilteredCars = () => {
    if (!selectedRide) return [];
    return cars.filter(c => c.car_type === selectedRide.car_type);
  };

  return (
    <div style={{ padding: '3rem 0', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: 'var(--secondary)' }}>Manual Dispatch Board</h1>
            <p>Bookings dispatch desk – manually assign cars & drivers to customer requests</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => fetchData()} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border-color)' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                setNewScheduledDate(`${year}-${month}-${day}`);
                setNewScheduledTime(`${hours}:${minutes}`);
                
                // Reset return date/time if any
                setNewReturnDate('');
                setNewReturnTime('');
                
                setShowAddBookingModal(true);
              }}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={14} /> Create Booking
            </button>
          </div>
        </div>

        {/* Date Filter Panel */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', backgroundColor: 'var(--card-color)' }}>
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


        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem' }}>
            <div style={{ color: 'var(--text-muted)' }}>Loading bookings records...</div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
            <p>No taxi bookings placed yet.</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
            <p>No taxi bookings match the selected date filters.</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Passenger</th>
                  <th>Trip Details</th>
                  <th>Route & Distance</th>
                  <th>Cost & Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.map(ride => (
                  <tr key={ride.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>
                        {ride.customer_name || ride.customer?.full_name || 'Guest User'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        📞 {ride.customer_phone || ride.customer?.phone || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        📅 {new Date(ride.scheduled_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        ⏰ {new Date(ride.scheduled_at).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'capitalize', marginTop: '0.25rem' }}>
                        Type: {ride.car_type} | {ride.ride_type.replace('_', ' ')}
                      </div>
                      {ride.notes && ride.notes.includes('Return Trip:') && (
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>
                          🔄 {ride.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem', maxWidth: '200px' }}>
                      <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        📍 <strong>From:</strong> {ride.pickup_address}
                      </div>
                      <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '0.25rem' }}>
                        📍 <strong>To:</strong> {ride.drop_address}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Distance: {ride.distance_km} KM
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>₹{ride.total_fare}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase' }}>
                        Mode: {ride.payment_mode || 'cash'}
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: ride.payment_status === 'paid' ? 'var(--success)' : 'var(--accent)', marginTop: '0.25rem' }}>
                        ● {ride.payment_status?.toUpperCase()}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${ride.status}`} style={{ fontSize: '0.65rem' }}>
                        {ride.status.replace('_', ' ')}
                      </span>
                      {ride.driver && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                          Driver: <strong>{ride.driver.profile?.full_name?.split(' ')[0]}</strong>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {ride.status === 'pending' && (
                          <button
                            onClick={() => openAssignModal(ride)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                          >
                            Assign Driver
                          </button>
                        )}
                        {['pending', 'confirmed'].includes(ride.status) && (
                          <button
                            onClick={() => handleCancelBooking(ride.id)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                          >
                            Cancel
                          </button>
                        )}
                        {!['pending', 'confirmed'].includes(ride.status) && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Locked</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', padding: '1rem 0', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredBookings.length)} of {filteredBookings.length} records
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

      {/* Manual Driver & Car Assignment Modal */}
      {selectedRide && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--secondary)' }}>Manual Driver Assignment</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Booking ID: #{selectedRide.id.slice(0, 8).toUpperCase()} | Class: <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>{selectedRide.car_type}</span>
              </p>
            </div>

            <form onSubmit={handleAssignSubmit}>
              
              {/* Select Car */}
              <div className="form-group">
                <label className="form-label">Select Active vehicle (Filtered by {selectedRide.car_type.toUpperCase()})</label>
                {getFilteredCars().length === 0 ? (
                  <div style={{ color: 'var(--error)', fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem', border: '1px solid rgba(239,68,68,0.2)', backgroundColor: '#FEF2F2', borderRadius: 'var(--radius-sm)' }}>
                    ⚠️ No active {selectedRide.car_type.toUpperCase()}s available! Please add or activate a vehicle.
                  </div>
                ) : (
                  <select
                    className="form-control"
                    value={carId}
                    onChange={(e) => {
                      setCarId(e.target.value);
                      // Auto-select corresponding driver linked to this car
                      const linkedDriver = drivers.find(d => d.current_car_id === e.target.value);
                      if (linkedDriver) setDriverId(linkedDriver.id);
                    }}
                    required
                  >
                    {getFilteredCars().map(car => (
                      <option key={car.id} value={car.id}>
                        {car.color} {car.brand} {car.model} ({car.registration_number})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Select Driver */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Select Active Driver</label>
                {drivers.length === 0 ? (
                  <div style={{ color: 'var(--error)', fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem', border: '1px solid rgba(239,68,68,0.2)', backgroundColor: '#FEF2F2', borderRadius: 'var(--radius-sm)' }}>
                    ⚠️ No active drivers available. Add a driver first.
                  </div>
                ) : (
                  <select
                    className="form-control"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    required
                  >
                    {drivers.map(drv => {
                      // Check if driver has a current car linked
                      const linkedCar = cars.find(c => c.id === drv.current_car_id);
                      const carLabel = linkedCar ? ` - [Linked to ${linkedCar.registration_number}]` : ' - [No vehicle linked]';
                      return (
                        <option key={drv.id} value={drv.id}>
                          {drv.profile?.full_name} ({drv.profile?.phone}){carLabel}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1, border: '1px solid var(--border-color)' }}
                  onClick={() => setSelectedRide(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={assigning || getFilteredCars().length === 0 || drivers.length === 0}
                >
                  {assigning ? 'Assigning...' : 'Confirm & Dispatch Ride'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Create Manual Booking Modal */}
      {showAddBookingModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--secondary)' }}>Create Manual Booking</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Enter booking details received via Phone or WhatsApp</p>
            </div>

            <form onSubmit={handleCreateBookingSubmit}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Passenger Name (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Aswin Kumar"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Passenger Mobile</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 9360161453"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Ride Type</label>
                  <select
                    className="form-control"
                    value={newRideType}
                    onChange={(e: any) => setNewRideType(e.target.value)}
                    required
                  >
                    <option value="one_way">One Way</option>
                    <option value="round_trip">Round Trip</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Class</label>
                  <select
                    className="form-control"
                    value={newCarType}
                    onChange={(e: any) => setNewCarType(e.target.value)}
                    required
                  >
                    <option value="sedan">Sedan (Comfort)</option>
                    <option value="suv">SUV (Spacious)</option>
                    <option value="innova">Innova (Premium)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pickup Address</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Starting location"
                  value={newPickupAddress}
                  onChange={(e) => setNewPickupAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Drop Address</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Destination location"
                  value={newDropAddress}
                  onChange={(e) => setNewDropAddress(e.target.value)}
                  required
                />
              </div>

              {/* Custom Date Time Pickers matching the /book page clock design */}
              <CustomDateTimePicker
                label="Pickup Date & Time"
                valueDate={newScheduledDate}
                valueTime={newScheduledTime}
                onChange={(date, time) => {
                  setNewScheduledDate(date);
                  setNewScheduledTime(time);
                }}
                minDate="2026-08-01"
              />

              {newRideType === 'round_trip' && (
                <CustomDateTimePicker
                  label="Return Date & Time"
                  valueDate={newReturnDate}
                  valueTime={newReturnTime}
                  onChange={(date, time) => {
                    setNewReturnDate(date);
                    setNewReturnTime(time);
                  }}
                  minDate="2026-08-01"
                />
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Distance (KM)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Estimated distance"
                    value={newDistanceKm}
                    onChange={(e) => setNewDistanceKm(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Fare (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 2400"
                    value={newTotalFare}
                    onChange={(e) => setNewTotalFare(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-control"
                  value={newPaymentMode}
                  onChange={(e: any) => setNewPaymentMode(e.target.value)}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1, border: '1px solid var(--border-color)' }}
                  onClick={() => setShowAddBookingModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={assigning}
                >
                  {assigning ? 'Creating...' : 'Create Booking'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Inline styles for custom calendar cell hover states */}
      <style dangerouslySetInnerHTML={{__html: `
        .day-cell-hover {
          transition: background-color 0.2s, color 0.2s;
        }
        .day-cell-hover:hover {
          background-color: rgba(249, 115, 22, 0.1) !important;
          color: var(--primary) !important;
        }
      `}} />
    </div>
  );
}

// Custom Date & Time Picker copied from /book page
interface CustomDateTimePickerProps {
  label: string;
  valueDate: string;
  valueTime: string;
  onChange: (date: string, time: string) => void;
  minDate?: string;
}

function CustomDateTimePicker({ label, valueDate, valueTime, onChange, minDate }: CustomDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Helper to format date display
  const formatDisplayDateTime = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return 'Select Date & Time';
    const [year, month, day] = dateStr.split('-');
    const [hours, minutes] = timeStr.split(':');
    const hourNum = parseInt(hours, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = String(hourNum % 12 || 12).padStart(2, '0');
    return `${day}-${month}-${year} ${formattedHour}:${minutes} ${ampm}`;
  };

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Split selected valueDate & valueTime into local state for temporary changes
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed

  // For time
  const [selectedHour, setSelectedHour] = useState('12');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const [clockMode, setClockMode] = useState<'hour' | 'minute'>('hour');

  useEffect(() => {
    if (valueDate) {
      const parts = valueDate.split('-');
      if (parts.length === 3) {
        setCurrentYear(parseInt(parts[0], 10));
        setCurrentMonth(parseInt(parts[1], 10) - 1);
      }
    }
    if (valueTime) {
      const [h, m] = valueTime.split(':');
      const hourNum = parseInt(h, 10);
      setSelectedPeriod(hourNum >= 12 ? 'PM' : 'AM');
      setSelectedHour(String(hourNum % 12 || 12).padStart(2, '0'));
      setSelectedMinute(m);
    }
    if (isOpen) {
      setClockMode('hour');
    }
  }, [valueDate, valueTime, isOpen]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleDaySelect = (dayNum: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const newDateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    
    // Auto convert local 12h time to 24h format for saving
    let hr24 = parseInt(selectedHour, 10);
    if (selectedPeriod === 'PM' && hr24 !== 12) hr24 += 12;
    if (selectedPeriod === 'AM' && hr24 === 12) hr24 = 0;
    const newTimeStr = `${String(hr24).padStart(2, '0')}:${selectedMinute}`;
    
    onChange(newDateStr, newTimeStr);
  };

  const handleTimeSelect = (type: 'hour' | 'minute' | 'period', val: string) => {
    let hr = selectedHour;
    let min = selectedMinute;
    let prd = selectedPeriod;

    if (type === 'hour') {
      hr = val;
      setSelectedHour(val);
    } else if (type === 'minute') {
      min = val;
      setSelectedMinute(val);
    } else if (type === 'period') {
      prd = val;
      setSelectedPeriod(val);
    }

    let hr24 = parseInt(hr, 10);
    if (prd === 'PM' && hr24 !== 12) hr24 += 12;
    if (prd === 'AM' && hr24 === 12) hr24 = 0;
    const newTimeStr = `${String(hr24).padStart(2, '0')}:${min}`;
    
    onChange(valueDate, newTimeStr);
  };

  // Render Days Grid
  const daysArray = [];
  // Add empty slots for firstDayIndex padding
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const getIsActiveDay = (day: number | null) => {
    if (!day) return false;
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    return valueDate === `${currentYear}-${formattedMonth}-${formattedDay}`;
  };

  const getHandRotation = () => {
    if (clockMode === 'hour') {
      const h = parseInt(selectedHour, 10);
      return (h * 30 + 180) % 360;
    } else {
      const m = parseInt(selectedMinute, 10);
      return (m * 6 + 180) % 360;
    }
  };

  const handleClockClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 70; // 70 is cx
    const y = e.clientY - rect.top - 70;  // 70 is cy
    
    const angleRad = Math.atan2(y, x);
    let angleDeg = angleRad * 180 / Math.PI;
    
    // adjust so 12 o'clock (top) is 0 degrees
    let angleFrom12 = angleDeg + 90;
    if (angleFrom12 < 0) {
      angleFrom12 += 360;
    }
    
    if (clockMode === 'hour') {
      let hour = Math.round(angleFrom12 / 30);
      if (hour === 0) hour = 12;
      if (hour > 12) hour = hour - 12;
      const hStr = String(hour).padStart(2, '0');
      handleTimeSelect('hour', hStr);
      // Auto-switch to minutes mode for seamless flow
      setClockMode('minute');
    } else {
      let minuteVal = Math.round(angleFrom12 / 6);
      // round to nearest 5 minutes
      minuteVal = Math.round(minuteVal / 5) * 5;
      if (minuteVal >= 60) minuteVal = 0;
      const mStr = String(minuteVal).padStart(2, '0');
      handleTimeSelect('minute', mStr);
    }
  };

  return (
    <div className="form-group" style={{ position: 'relative', marginBottom: '1.5rem' }} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          backgroundColor: 'white',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
          zIndex: 5
        }}
      >
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>
            {label}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '0.02em' }}>
            {formatDisplayDateTime(valueDate, valueTime)}
          </div>
        </div>
        <Calendar size={20} style={{ color: 'var(--text-muted)' }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '105%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '380px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Main content grid: Calendar on left, Round Clock on right */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1rem' }}>
            
            {/* Calendar section */}
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <button type="button" onClick={handlePrevMonth} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>&larr;</button>
                <span style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '0.9rem' }}>
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <button type="button" onClick={handleNextMonth} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>&rarr;</button>
              </div>

              {/* Day Labels */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
              </div>

              {/* Days grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {daysArray.map((day, idx) => {
                  const isActive = getIsActiveDay(day);
                  return (
                    <div
                      key={idx}
                      onClick={() => day && handleDaySelect(day)}
                      style={{
                        padding: '6px 0',
                        textAlign: 'center',
                        fontSize: '0.8rem',
                        cursor: day ? 'pointer' : 'default',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                        color: isActive ? '#FFFFFF' : day ? 'var(--secondary)' : 'transparent',
                        fontWeight: isActive ? 700 : 500,
                        transition: 'background-color 0.2s',
                        border: '1px solid transparent'
                      }}
                      className={day ? "day-cell-hover" : ""}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Round Clock Time Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem' }}>
              
              {/* Header preview showing current selection */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem', userSelect: 'none' }}>
                <div style={{ display: 'flex', gap: '3px', fontSize: '1.4rem', fontWeight: 800, alignItems: 'baseline' }}>
                  <span 
                    onClick={() => setClockMode('hour')} 
                    style={{ 
                      color: clockMode === 'hour' ? 'var(--primary)' : 'var(--secondary)', 
                      cursor: 'pointer', 
                      borderBottom: clockMode === 'hour' ? '2.5px solid var(--primary)' : 'none',
                      padding: '0 4px',
                      lineHeight: 1.1
                    }}
                  >
                    {selectedHour}
                  </span>
                  <span style={{ color: 'var(--secondary)' }}>:</span>
                  <span 
                    onClick={() => setClockMode('minute')} 
                    style={{ 
                      color: clockMode === 'minute' ? 'var(--primary)' : 'var(--secondary)', 
                      cursor: 'pointer', 
                      borderBottom: clockMode === 'minute' ? '2.5px solid var(--primary)' : 'none',
                      padding: '0 4px',
                      lineHeight: 1.1
                    }}
                  >
                    {selectedMinute}
                  </span>
                  <span style={{ 
                    color: '#94a3b8',
                    marginLeft: '8px',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    textTransform: 'uppercase'
                  }}>
                    {selectedPeriod}
                  </span>
                </div>
              </div>

              {/* Round Clock Face */}
              <div 
                onClick={handleClockClick}
                style={{
                  position: 'relative',
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  margin: '0.1rem 0 0.5rem 0'
                }}
              >
                {/* Center dot */}
                <div style={{
                  position: 'absolute',
                  left: '67px',
                  top: '67px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  zIndex: 10
                }} />

                {/* Hand line */}
                <div style={{
                  position: 'absolute',
                  left: '69px',
                  top: '70px',
                  width: '2px',
                  height: '52px',
                  backgroundColor: 'rgba(249, 115, 22, 0.4)',
                  transformOrigin: 'top center',
                  transform: `rotate(${getHandRotation()}deg)`,
                  zIndex: 8
                }} />

                {/* Numbers */}
                {clockMode === 'hour' ? (
                  [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => {
                    const theta = (h * 30 - 90) * Math.PI / 180;
                    const x = 70 + 52 * Math.cos(theta);
                    const y = 70 + 52 * Math.sin(theta);
                    const isActive = parseInt(selectedHour, 10) === h;
                    return (
                      <div
                        key={h}
                        style={{
                          position: 'absolute',
                          left: `${x}px`,
                          top: `${y}px`,
                          transform: 'translate(-50%, -50%)',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: isActive ? 800 : 500,
                          backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                          color: isActive ? 'white' : 'var(--secondary)',
                          zIndex: 9
                        }}
                      >
                        {h}
                      </div>
                    );
                  })
                ) : (
                  [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => {
                    const theta = (m * 6 - 90) * Math.PI / 180;
                    const x = 70 + 52 * Math.cos(theta);
                    const y = 70 + 52 * Math.sin(theta);
                    const isActive = parseInt(selectedMinute, 10) === m;
                    const displayVal = String(m).padStart(2, '0');
                    return (
                      <div
                        key={m}
                        style={{
                          position: 'absolute',
                          left: `${x}px`,
                          top: `${y}px`,
                          transform: 'translate(-50%, -50%)',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: isActive ? 800 : 500,
                          backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                          color: isActive ? 'white' : 'var(--secondary)',
                          zIndex: 9
                        }}
                      >
                        {displayVal}
                      </div>
                    );
                  })
                )}
              </div>

              {/* AM/PM switcher */}
              <div style={{ display: 'flex', gap: '6px', width: '100%', padding: '0 0.1rem' }}>
                {['AM', 'PM'].map(p => {
                  const isActive = selectedPeriod === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleTimeSelect('period', p)}
                      style={{
                        flex: 1,
                        padding: '3px 0',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isActive ? 'var(--secondary)' : 'white',
                        color: isActive ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                onChange(`${year}-${month}-${day}`, `${hours}:${minutes}`);
              }}
              style={{
                fontSize: '0.75rem',
                color: 'var(--primary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Today (Now)
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: 'var(--secondary)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
