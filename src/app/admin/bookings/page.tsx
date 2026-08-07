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
    if (!newCustomerName || !newCustomerPhone || !newPickupAddress || !newDropAddress || !newScheduledDate || !newScheduledTime || !newTotalFare) {
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
          customer_name: newCustomerName.trim(),
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
            <button onClick={() => setShowAddBookingModal(true)} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                  <label className="form-label">Passenger Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Aswin Kumar"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    required
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Pickup Date</label>
                  <input
                    type="date"
                    className="form-control"
                    min="2026-08-01"
                    value={newScheduledDate}
                    onChange={(e) => setNewScheduledDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pickup Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={newScheduledTime}
                    onChange={(e) => setNewScheduledTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {newRideType === 'round_trip' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Return Date</label>
                    <input
                      type="date"
                      className="form-control"
                      min="2026-08-01"
                      value={newReturnDate}
                      onChange={(e) => setNewReturnDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Return Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={newReturnTime}
                      onChange={(e) => setNewReturnTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
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

    </div>
  );
}
