'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

export default function DriverLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError || !authData.user) {
        throw new Error(loginError?.message || 'Incorrect email or password.');
      }

      // Check user role from profiles
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
        throw new Error(`This portal is for drivers. Your account has the '${profile.role}' role.`);
      }

      // Successful login - redirect to driver dashboard
      router.push('/driver/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during login.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1.5rem',
      backgroundColor: 'var(--bg-color)',
      minHeight: 'calc(100vh - var(--header-height) - 300px)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{
            backgroundColor: 'rgba(30, 41, 59, 0.05)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-full)',
            color: 'var(--secondary)',
            display: 'inline-flex',
            marginBottom: '1rem'
          }}>
            <ShieldCheck size={28} />
          </span>
          <h2 style={{ color: 'var(--secondary)' }}>Driver Dashboard Login</h2>
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
            <input
              type="email"
              className="form-control"
              placeholder="driver@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} style={{ color: 'var(--primary)' }} /> Password
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In as Driver'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Are you a customer?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Customer portal login
          </Link>
        </div>
      </div>
    </div>
  );
}
