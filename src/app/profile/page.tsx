'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Phone, Mail, MapPin, Save, Plus, Trash } from 'lucide-react';

export default function CustomerProfile() {
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // Saved addresses state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setEmail(user.email || '');
        fetchProfile(user.id);
      }
    });
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setAddresses(data.saved_addresses || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          saved_addresses: addresses,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newAddress.trim()) return;

    const updated = [...addresses, { label: newLabel.trim(), address: newAddress.trim() }];
    setAddresses(updated);
    setNewLabel('');
    setNewAddress('');
  };

  const handleRemoveAddress = (index: number) => {
    const updated = addresses.filter((_, i) => i !== index);
    setAddresses(updated);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem 0', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        <h1 style={{ fontSize: '2rem', color: 'var(--secondary)', marginBottom: '2rem' }}>My Profile & Settings</h1>

        {message && (
          <div className="alert alert-success">
            <span>{message}</span>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid-2" style={{ gap: '2rem' }}>
          
          {/* Edit Profile details card */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
              Account Information
            </h3>

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={14} style={{ color: 'var(--primary)' }} /> Full Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={14} style={{ color: 'var(--primary)' }} /> Phone Number
                </label>
                <input
                  type="tel"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} style={{ color: 'var(--primary)' }} /> Email (ReadOnly)
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  disabled
                  style={{ backgroundColor: '#F1F5F9', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }} disabled={saving}>
                <Save size={18} /> {saving ? 'Saving changes...' : 'Save Profile Settings'}
              </button>
            </form>
          </div>

          {/* Saved Addresses management card */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
              Manage Saved Addresses
            </h3>

            {/* List current addresses */}
            {addresses.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>No saved addresses. Add common locations below to book faster.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {addresses.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <MapPin size={16} style={{ color: 'var(--primary)', marginTop: '0.2rem' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--secondary)' }}>{item.label}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.address}</div>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleRemoveAddress(index)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Address Form */}
            <form onSubmit={handleAddAddress} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '0.75rem' }}>Add New Location</div>
              
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Label (e.g. Home, Office, Coimbatore Airport)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Full Address"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-outline btn-sm" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                <Plus size={16} /> Add Address List
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
