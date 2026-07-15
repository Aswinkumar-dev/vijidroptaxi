'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function DriverLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

      if (loginError || !authData.user) {
        throw new Error(loginError?.message || 'Incorrect email or password.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error('Profile details could not be found.');
      }

      if (profile.role !== 'driver') {
        await supabase.auth.signOut();
        throw new Error(`This portal is for drivers only. Your account role is '${profile.role}'.`);
      }

      // Block if KYC not approved
      if (profile.kyc_status !== 'approved') {
        await supabase.auth.signOut();
        throw new Error('Your KYC verification is still pending. You will be notified once it is approved by the admin.');
      }

      router.push('/driver/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during login.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1.5rem', minHeight: '100vh', backgroundColor: 'var(--bg-color)'
    }}>
      <div className="card auth-floating-card" style={{
        width: '100%', maxWidth: '440px', padding: '2.5rem',
        background: 'rgba(255, 255, 255, 0.82)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <img
              src="/assets/car icon sign up.png"
              alt="Viji Drop Taxi"
              style={{ width: '150px', height: 'auto', objectFit: 'contain', transform: 'translateX(-8px)' }}
            />
          </div>
          <h2 style={{ color: 'var(--secondary)' }}>Driver Portal Sign In</h2>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Manage your active runs and view earnings</p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} style={{ color: 'var(--primary)' }} /> Driver Email
            </label>
            <input type="email" className="form-control" placeholder="driver@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%' }} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} style={{ color: 'var(--primary)' }} /> Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingRight: '2.75rem', boxSizing: 'border-box' }}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', padding: 0,
              }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In as Driver'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          New driver?{' '}
          <Link href="/driver/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
