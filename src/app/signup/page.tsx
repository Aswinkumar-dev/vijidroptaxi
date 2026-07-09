'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, User, Phone, Mail, Lock } from 'lucide-react';

export default function Signup() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // Field Validations
    if (fullName.trim().length < 2) {
      setErrorMsg('Full Name must be at least 2 characters long.');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (phone.length !== 10) {
      setErrorMsg('Phone number must be exactly 10 digits (numbers only).');
      setLoading(false);
      return;
    }

    if (password.length < 5) {
      setErrorMsg('Password must be at least 5 characters long.');
      setLoading(false);
      return;
    }

    try {
      // 1. Supabase Auth signup
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError || !authData.user) {
        throw new Error(signUpError?.message || 'Authentication signup failed.');
      }

      // 2. Insert profile record (customer role by default)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName.trim(),
          phone: '+91' + phone,
          role: 'customer',
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(profileError.message || 'Failed to create user profile. Phone number might already be in use.');
      }

      // Successful signup
      router.push('/login?msg=Signup successful! Please log in.');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during signup.');
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
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem' }}>
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
          <h2 style={{ color: 'var(--secondary)' }}>Create Account</h2>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Sign up to book premium taxis instantly</p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={14} style={{ color: 'var(--primary)' }} /> Full Name
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Phone size={14} style={{ color: 'var(--primary)' }} /> Phone Number
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{
                backgroundColor: '#F1F5F9',
                padding: '0.75rem 1rem',
                border: '1px solid #CBD5E1',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                color: 'var(--secondary)'
              }}>+91</span>
              <input
                type="text"
                className="form-control"
                style={{ flex: 1 }}
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} style={{ color: 'var(--primary)' }} /> Email Address
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="customer@vijidroptaxi.com"
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
              placeholder="Choose a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
