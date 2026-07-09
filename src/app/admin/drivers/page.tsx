'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RefreshCw, UserPlus, CreditCard, Calendar, Check, X, ShieldAlert } from 'lucide-react';

export default function AdminDrivers() {
  const router = useRouter();

  const [drivers, setDrivers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Add/Edit Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [profileId, setProfileId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [carId, setCarId] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

      // Fetch drivers joined with profiles and cars
      const { data: driversData, error: driversErr } = await supabase
        .from('drivers')
        .select(`
          *,
          profile:profiles(id, full_name, phone, role),
          car:cars(*)
        `)
        .order('joined_at', { ascending: false });

      if (driversErr) throw driversErr;
      setDrivers(driversData || []);

      // Fetch all registered profiles with role 'driver'
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'driver');

      if (profilesErr) throw profilesErr;
      setProfiles(profilesData || []);

      // Fetch active cars
      const { data: carsData, error: carsErr } = await supabase
        .from('cars')
        .select('*');

      if (carsErr) throw carsErr;
      setCars(carsData || []);

    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !licenseNumber) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload: any = {
        profile_id: profileId,
        license_number: licenseNumber.trim(),
        is_active: true
      };

      if (licenseExpiry) {
        payload.license_expiry = licenseExpiry;
      }
      if (carId) {
        payload.current_car_id = carId;
      }

      const { error } = await supabase
        .from('drivers')
        .insert(payload);

      if (error) {
        if (error.code === '23505') {
          throw new Error('A driver profile or license number already exists for this registration.');
        }
        throw error;
      }

      setShowAddModal(false);
      setProfileId('');
      setLicenseNumber('');
      setLicenseExpiry('');
      setCarId('');
      fetchData();
      alert('Driver credentials linked successfully!');
    } catch (err: any) {
      alert(err.message || 'Error occurred linking driver.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDriverActive = async (driverId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ is_active: !currentStatus })
        .eq('id', driverId);

      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error toggling driver status.');
    }
  };

  // Determine profiles that have NOT been linked in drivers table yet
  const getUnlinkedProfiles = () => {
    const linkedProfileIds = drivers.map(d => d.profile_id);
    return profiles.filter(p => !linkedProfileIds.includes(p.id));
  };

  return (
    <div style={{ padding: '3rem 0', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
      <div className="container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: 'var(--secondary)' }}>Driver Fleet Registry</h1>
            <p>Manage driver documentation and link vehicle assignments</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchData} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border-color)' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserPlus size={14} /> Link Registered Profile
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem' }}>
            <div style={{ color: 'var(--text-muted)' }}>Loading drivers roster...</div>
          </div>
        ) : drivers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ marginBottom: '1.5rem' }}>No drivers registered yet. Instruct drivers to register on the site with a 'driver' role first.</p>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">Link First Driver</button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Driver Details</th>
                  <th>License Number</th>
                  <th>License Expiry</th>
                  <th>Linked Vehicle</th>
                  <th>Rating / Rides</th>
                  <th>Active Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(drv => (
                  <tr key={drv.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>{drv.profile?.full_name || 'Broken Profile'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📞 {drv.profile?.phone}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace' }}>
                      {drv.license_number}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {drv.license_expiry ? new Date(drv.license_expiry).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Not Entered'}
                    </td>
                    <td>
                      {drv.car ? (
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{drv.car.brand} {drv.car.model}</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{drv.car.registration_number}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No car linked</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <div>⭐ {drv.rating_avg} Rating</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{drv.total_rides || 0} Rides</div>
                    </td>
                    <td>
                      <span className={`badge ${drv.is_active ? 'badge-completed' : 'badge-cancelled'}`}>
                        {drv.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleDriverActive(drv.id, drv.is_active)}
                        className={`btn btn-sm ${drv.is_active ? 'btn-danger' : 'btn-primary'}`}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        {drv.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Link Driver Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--secondary)' }}>Link Driver Documentation</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Link a registered driver user profile to driver credentials
              </p>
            </div>

            <form onSubmit={handleAddSubmit}>
              
              {/* Select Profile */}
              <div className="form-group">
                <label className="form-label">Select Registered User Profile (Role: Driver)</label>
                {getUnlinkedProfiles().length === 0 ? (
                  <div style={{ color: 'var(--error)', fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem', border: '1px solid rgba(239,68,68,0.2)', backgroundColor: '#FEF2F2', borderRadius: 'var(--radius-sm)' }}>
                    ⚠️ No unlinked driver profiles found. Ask drivers to register on the site as 'driver' first.
                  </div>
                ) : (
                  <select
                    className="form-control"
                    value={profileId}
                    onChange={(e) => setProfileId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Profile --</option>
                    {getUnlinkedProfiles().map(prof => (
                      <option key={prof.id} value={prof.id}>
                        {prof.full_name} ({prof.phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* License Details */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CreditCard size={14} style={{ color: 'var(--primary)' }} /> License Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="E.g. DL-142023000567"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} style={{ color: 'var(--primary)' }} /> License Expiry Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                />
              </div>

              {/* Vehicle select */}
              <div className="form-group">
                <label className="form-label">Link Active vehicle</label>
                <select
                  className="form-control"
                  value={carId}
                  onChange={(e) => setCarId(e.target.value)}
                >
                  <option value="">-- No vehicle (unlinked) --</option>
                  {cars.map(car => (
                    <option key={car.id} value={car.id}>
                      {car.color} {car.brand} {car.model} ({car.registration_number}) - {car.car_type.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1, border: '1px solid var(--border-color)' }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={submitting || getUnlinkedProfiles().length === 0}
                >
                  {submitting ? 'Linking...' : 'Link Driver'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
