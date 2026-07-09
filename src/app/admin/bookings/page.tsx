'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RefreshCw, MapPin, Calendar, Clock, User, Car, Tag, Check, X, ShieldAlert } from 'lucide-react';

export default function AdminBookings() {
  const router = useRouter();

  const [bookings, setBookings] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Assignment Modal State
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [driverId, setDriverId] = useState('');
  const [carId, setCarId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
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

      // Fetch all bookings (using client-side query)
      const { data: ridesData, error: ridesErr } = await supabase
        .from('rides')
        .select(`
          *,
          customer:profiles!rides_customer_id_fkey(id, full_name, phone),
          driver:drivers(
            id,
            profile:profiles(id, full_name, phone)
          ),
          car:cars(*)
        `)
        .order('scheduled_at', { ascending: false });

      if (ridesErr) throw ridesErr;
      setBookings(ridesData || []);

      // Fetch active drivers
      const { data: driversData, error: driversErr } = await supabase
        .from('drivers')
        .select(`
          id,
          profile:profiles(id, full_name, phone),
          current_car_id
        `)
        .eq('is_active', true);

      if (driversErr) throw driversErr;
      setDrivers(driversData || []);

      // Fetch active vehicles
      const { data: carsData, error: carsErr } = await supabase
        .from('cars')
        .select('*')
        .eq('is_active', true);

      if (carsErr) throw carsErr;
      setCars(carsData || []);

    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred fetching bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAssignModal = (ride: any) => {
    setSelectedRide(ride);
    
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
        body: JSON.stringify({ driver_id: driverId, car_id: carId }),
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
      const { error } = await supabase
        .from('rides')
        .update({
          status: 'cancelled',
          cancelled_reason: 'Cancelled by administrator dispatcher',
          updated_at: new Date().toISOString()
        })
        .eq('id', rideId);

      if (error) throw error;
      fetchData();
      alert('Booking cancelled successfully.');
    } catch (err: any) {
      alert(err.message || 'Error cancelling booking.');
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
          <button onClick={fetchData} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={16} /> Refresh Bookings
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
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Passenger</th>
                  <th>Trip Details</th>
                  <th>Route & Distance</th>
                  <th>Cost & Payment</th>
                  <th>Status & OTP</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(ride => (
                  <tr key={ride.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>
                        {ride.customer?.full_name || 'Deleted Account'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        📞 {ride.customer?.phone}
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
                      {ride.otp && (
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.4rem', fontFamily: 'monospace' }}>
                          OTP: {ride.otp}
                        </div>
                      )}
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
                    ⚠️ No active {selectedRide.car_type.toUpperCase()}s available in the fleet! Please add or activate a vehicle.
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
                  {assigning ? 'Assigning...' : 'Dispatch Ride & Generate OTP'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
