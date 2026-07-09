'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Phone, Mail, Award, Car, CreditCard, Calendar } from 'lucide-react';

export default function DriverProfile() {
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/driver/login');
      } else {
        setEmail(user.email || '');
        fetchDriverProfile(user.id);
      }
    });
  }, []);

  const fetchDriverProfile = async (userId: string) => {
    try {
      // 1. Get profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (profileErr) throw profileErr;
      setProfile(profileData);

      // 2. Get driver record and vehicle
      const { data: driverData, error: driverErr } = await supabase
        .from('drivers')
        .select(`
          *,
          car:cars(*)
        `)
        .eq('profile_id', userId)
        .single();

      if (driverErr && driverErr.code !== 'PGRST116') {
        throw driverErr;
      }
      setDriver(driverData || null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load driver profile details.');
    } finally {
      setLoading(false);
    }
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
        
        <h1 style={{ fontSize: '2rem', color: 'var(--secondary)', marginBottom: '2rem' }}>Vehicle & License Settings</h1>

        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid-2" style={{ gap: '2rem' }}>
          
          {/* Driver account details card */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} style={{ color: 'var(--primary)' }} /> Personal Account Info
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Name</div>
                  <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>{profile?.full_name}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Phone</div>
                  <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>{profile?.phone}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sign In Email</div>
                  <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>{email || 'Linked Account'}</div>
                </div>
              </div>

              {driver && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <Award size={16} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Licensing & Registration status</div>
                    <div style={{ fontWeight: 600, color: 'var(--success)' }}>Active & Verified Driver</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle and License details card */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} style={{ color: 'var(--primary)' }} /> Driver Credentials
            </h3>

            {driver ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CreditCard size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>License Number</div>
                    <div style={{ fontWeight: 600, color: 'var(--secondary)', letterSpacing: '0.05em' }}>{driver.license_number}</div>
                  </div>
                </div>

                {driver.license_expiry && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>License Expiry Date</div>
                      <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>
                        {new Date(driver.license_expiry).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Assigned Vehicle */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Car size={16} style={{ color: 'var(--primary)' }} /> Linked Active Fleet Vehicle
                  </h4>
                  {driver.car ? (
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>{driver.car.color} {driver.car.brand} {driver.car.model}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Type: {driver.car.car_type.toUpperCase()} | Seats: {driver.car.seating_capacity}</div>
                      <div style={{
                        backgroundColor: 'var(--secondary)',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        width: 'fit-content',
                        marginTop: '0.5rem',
                        letterSpacing: '0.05em'
                      }}>{driver.car.registration_number}</div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No vehicle has been assigned to you by the dispatcher yet. Contact administrator.</span>
                  )}
                </div>

              </div>
            ) : (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Driver documentation not fully configured in database. Please contact dispatcher.</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
