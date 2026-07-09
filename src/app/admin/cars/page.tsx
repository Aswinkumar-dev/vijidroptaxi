'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Plus, Car, ShieldCheck, Settings, Layers } from 'lucide-react';

export default function AdminCars() {
  const router = useRouter();

  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Add Car Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [carType, setCarType] = useState<'hatchback' | 'sedan' | 'suv'>('sedan');
  const [seatingCapacity, setSeatingCapacity] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  const fetchCars = async () => {
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

      // Fetch cars
      const { data: carsData, error: carsErr } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (carsErr) throw carsErr;
      setCars(carsData || []);

    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationNumber || !brand || !model || !color) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('cars')
        .insert({
          registration_number: registrationNumber.trim().toUpperCase(),
          brand: brand.trim(),
          model: model.trim(),
          color: color.trim(),
          car_type: carType,
          seating_capacity: seatingCapacity,
          is_active: true
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('A vehicle with this registration plate number is already registered.');
        }
        throw error;
      }

      setShowAddModal(false);
      setRegistrationNumber('');
      setBrand('');
      setModel('');
      setColor('');
      setCarType('sedan');
      setSeatingCapacity(4);
      fetchCars();
      alert('Vehicle added to fleet successfully!');
    } catch (err: any) {
      alert(err.message || 'Error occurred adding car.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCarActive = async (carId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ is_active: !currentStatus })
        .eq('id', carId);

      if (error) throw error;
      fetchCars();
    } catch (err: any) {
      alert(err.message || 'Error toggling car status.');
    }
  };

  return (
    <div style={{ padding: '3rem 0', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
      <div className="container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: 'var(--secondary)' }}>Fleet Management</h1>
            <p>Add, edit, or toggle active vehicles in your taxi fleet (scales from 3 to 10 cars easily)</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchCars} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border-color)' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={14} /> Add Vehicle
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
            <div style={{ color: 'var(--text-muted)' }}>Loading fleet list...</div>
          </div>
        ) : cars.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ marginBottom: '1.5rem' }}>No cars registered in the fleet database yet.</p>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">Add First Car</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {cars.map(car => (
              <div key={car.id} className="card card-hover" style={{ padding: '1.5rem', borderLeft: `6px solid ${car.is_active ? 'var(--success)' : 'var(--error)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                      Class: {car.car_type.toUpperCase()}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>
                      {car.color} {car.brand} <br />
                      {car.model}
                    </h3>
                  </div>
                  <span className={`badge ${car.is_active ? 'badge-completed' : 'badge-cancelled'}`}>
                    {car.is_active ? 'Active' : 'Maintenance'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                  <div><strong>Plate Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: 'var(--secondary)' }}>{car.registration_number}</span></div>
                  <div><strong>Seating capacity:</strong> {car.seating_capacity} Seats</div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => toggleCarActive(car.id, car.is_active)}
                    className={`btn btn-sm ${car.is_active ? 'btn-danger' : 'btn-primary'}`}
                    style={{ flex: 1 }}
                  >
                    {car.is_active ? 'Mark Inactive' : 'Mark Active'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Add Car Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--secondary)' }}>Add Vehicle to Fleet</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Register a new hatchback, sedan, or SUV</p>
            </div>

            <form onSubmit={handleAddSubmit}>
              
              <div className="form-group">
                <label className="form-label">Registration Number (License Plate)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="E.g. TN-37-AA-1234"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Brand / Make</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g. Maruti, Toyota"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g. Swift, Etios, Innova"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g. White, Silver, Black"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Seating capacity</label>
                  <input
                    type="number"
                    className="form-control"
                    value={seatingCapacity}
                    onChange={(e) => setSeatingCapacity(Math.max(1, Number(e.target.value)))}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Car Type Class</label>
                <select
                  className="form-control"
                  value={carType}
                  onChange={(e: any) => setCarType(e.target.value)}
                  required
                >
                  <option value="hatchback">Hatchback (Budget)</option>
                  <option value="sedan">Sedan (Comfort)</option>
                  <option value="suv">SUV (Spacious)</option>
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
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Vehicle'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
