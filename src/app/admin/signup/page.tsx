'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function AdminSignup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) { setErrorMsg('Please enter your full name.'); return; }
    if (!email.trim()) { setErrorMsg('Please enter your email address.'); return; }
    if (!phone.trim()) { setErrorMsg('Please enter your phone number.'); return; }
    if (!password || password.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }

    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, phone, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Registration failed.');

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '2rem 1.5rem', backgroundColor: 'var(--bg-color)'
      }}>
        <div className="card auth-floating-card" style={{
          maxWidth: '460px', width: '100%', padding: '2.5rem', textAlign: 'center',
          background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(18px)',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <CheckCircle size={40} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ color: 'var(--secondary)', marginBottom: '0.75rem' }}>Account Created</h2>
          <div style={{
            backgroundColor: 'rgba(249, 115, 22, 0.06)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
          }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--secondary)', lineHeight: 1.75 }}>
              Your admin account has been created and is waiting for approval. Please contact the system owner to activate it.
            </p>
          </div>
          <Link href="/admin/login" className="btn btn-primary" style={{ width: '100%', display: 'block' }}>
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1.5rem', minHeight: '100vh', backgroundColor: 'var(--bg-color)'
    }}>
      <div className="card auth-floating-card" style={{
        width: '100%', maxWidth: '440px', padding: '2.5rem',
        background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <img
              src="/assets/car icon sign up.png"
              alt="Viji Drop Taxi"
              style={{ width: '150px', height: 'auto', objectFit: 'contain', transform: 'translateX(-8px)' }}
            />
          </div>
          <h2 style={{ color: 'var(--secondary)' }}>Admin Registration</h2>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
            Request access to the admin portal
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={14} style={{ color: 'var(--primary)' }} /> Full Name
            </label>
            <input type="text" className="form-control" placeholder="Enter your full name"
              value={fullName} onChange={(e) => setFullName(e.target.value)}
              style={{ width: '100%' }} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} style={{ color: 'var(--primary)' }} /> Email Address
            </label>
            <input type="email" className="form-control" placeholder="admin@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%' }} required />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Phone size={14} style={{ color: 'var(--primary)' }} /> Phone Number
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{
                padding: '0 0.75rem', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center',
                backgroundColor: 'rgba(30,41,59,0.04)', fontWeight: 600, fontSize: '0.9rem',
                color: 'var(--secondary)', whiteSpace: 'nowrap',
              }}>+91</div>
              <input type="tel" className="form-control" placeholder="10-digit phone number"
                value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                style={{ flex: 1 }} maxLength={10} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} style={{ color: 'var(--primary)' }} /> Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Create a secure password"
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting}>
            {submitting ? 'Creating Account...' : 'Request Admin Access'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/admin/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
