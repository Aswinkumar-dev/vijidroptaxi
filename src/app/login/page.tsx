'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  useEffect(() => {
    const msg = searchParams.get('msg');
    if (msg) {
      setInfoMsg(msg);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

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
        // Sign out if profile not found
        await supabase.auth.signOut();
        throw new Error('Profile details could not be found.');
      }

      if (profile.role !== 'customer') {
        // Sign out if trying to access client dashboard with driver/admin role
        await supabase.auth.signOut();
        throw new Error(`This portal is for customers. Your account has the '${profile.role}' role. Please log in at the correct portal.`);
      }

      // Successful login - redirect to book ride or dashboard
      router.push('/book');
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
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-full)',
            color: 'var(--primary)',
            display: 'inline-flex',
            marginBottom: '1rem'
          }}>
            <ShieldCheck size={28} />
          </span>
          <h2 style={{ color: 'var(--secondary)' }}>Customer Login</h2>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Log in to book a ride and check status</p>
        </div>

        {infoMsg && (
          <div className="alert alert-success">
            <span>{infoMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} style={{ color: 'var(--primary)' }} /> Email Address
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="customer@example.com"
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          If you are a new user, please{' '}
          <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            sign up first
          </Link>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <div style={{ color: 'var(--text-muted)' }}>Are you a Driver or Administrator?</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <Link href="/driver/login" style={{ color: 'var(--secondary)', fontWeight: 600 }}>
              Driver Portal
            </Link>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <Link href="/admin/login" style={{ color: 'var(--secondary)', fontWeight: 600 }}>
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Loading login form...</div>}>
      <LoginContent />
    </Suspense>
  );
}
