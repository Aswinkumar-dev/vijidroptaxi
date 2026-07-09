'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RefreshCw, DollarSign, Save, Car, Compass } from 'lucide-react';

export default function AdminPricing() {
  const router = useRouter();

  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Form editing state
  const [editingRule, setEditingRule] = useState<any>(null);
  const [baseFare, setBaseFare] = useState('');
  const [perKmRate, setPerKmRate] = useState('');
  const [driverAllowance, setDriverAllowance] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPricing = async () => {
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

      // Fetch fare rules
      const { data: rulesData, error: rulesErr } = await supabase
        .from('fare_rules')
        .select('*')
        .order('car_type', { ascending: true });

      if (rulesErr) throw rulesErr;
      setRules(rulesData || []);

    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching fare rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const startEdit = (rule: any) => {
    setEditingRule(rule);
    setBaseFare(rule.base_fare.toString());
    setPerKmRate(rule.per_km_rate.toString());
    setDriverAllowance((rule.driver_allowance || 0).toString());
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || !baseFare || !perKmRate) return;

    setSaving(true);
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('fare_rules')
        .update({
          base_fare: Number(baseFare),
          per_km_rate: Number(perKmRate),
          driver_allowance: Number(driverAllowance || 0),
          applicable_from: new Date().toISOString()
        })
        .eq('id', editingRule.id);

      if (error) throw error;
      
      setEditingRule(null);
      setBaseFare('');
      setPerKmRate('');
      setDriverAllowance('');
      fetchPricing();
      alert('Fare pricing rule updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Error updating pricing rule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '3rem 0', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
      <div className="container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: 'var(--secondary)' }}>Fare Rules Configurator</h1>
            <p>Set base fare, per-km rates, and outstation driver allowances by vehicle class</p>
          </div>
          <button onClick={fetchPricing} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={16} /> Refresh Pricing
          </button>
        </div>

        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid-2" style={{ gap: '2rem', alignItems: 'flex-start' }}>
          
          {/* List of pricing config */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--secondary)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Current Active Tariffs
            </h3>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '1.5rem' }}>Loading configurations...</p>
            ) : rules.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No pricing tariff rules found. Please check back.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {rules.map(rule => (
                  <div key={rule.id} style={{
                    backgroundColor: '#F8FAFC',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--secondary)', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Car size={16} style={{ color: 'var(--primary)' }} /> {rule.car_type}
                        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                          ({rule.ride_type === 'one_way' ? 'One Way' : 'Round Trip'})
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Base: ₹{rule.base_fare} | Rate: ₹{rule.per_km_rate}/KM
                      </div>
                      {rule.driver_allowance > 0 && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Driver Allowance: ₹{rule.driver_allowance}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => startEdit(rule)}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    >
                      Edit Tariff
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit config form panel */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', color: 'var(--secondary)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Configure Tariffs
            </h3>

            {editingRule ? (
              <form onSubmit={handleSave}>
                <div style={{
                  backgroundColor: 'var(--bg-color)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                  color: 'var(--secondary)',
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}>
                  Editing Class: {editingRule.car_type} | Mode: {editingRule.ride_type.replace('_', ' ')}
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <DollarSign size={14} style={{ color: 'var(--primary)' }} /> Base Fare (INR)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={baseFare}
                    onChange={(e) => setBaseFare(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <DollarSign size={14} style={{ color: 'var(--primary)' }} /> Per-KM Rate (INR)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    step="0.5"
                    value={perKmRate}
                    onChange={(e) => setPerKmRate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <DollarSign size={14} style={{ color: 'var(--primary)' }} /> Driver Allowance (INR)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={driverAllowance}
                    onChange={(e) => setDriverAllowance(e.target.value)}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Charge added for outstations/round-trip overnight stays</small>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ flex: 1, border: '1px solid var(--border-color)' }}
                    onClick={() => setEditingRule(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                    disabled={saving}
                  >
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Tariff'}
                  </button>
                </div>
              </form>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '3rem 1.5rem' }}>
                Select a tariff card on the left to start editing the pricing configuration rules.
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
