'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Phone, Mail, Calendar, CreditCard, FileText, Eye, EyeOff, Upload, CheckCircle, Lock } from 'lucide-react';

export default function DriverSignup() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const aadharRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) { setErrorMsg('Please enter your full name.'); return; }
    if (!phone.trim()) { setErrorMsg('Please enter your mobile number.'); return; }
    if (!email.trim()) { setErrorMsg('Please enter your email address.'); return; }
    if (!dob) { setErrorMsg('Please enter your date of birth.'); return; }
    if (!password || password.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
    if (!aadharFile) { setErrorMsg('Please upload your Aadhar card.'); return; }
    if (!licenseFile) { setErrorMsg('Please upload your Driving License.'); return; }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('full_name', fullName);
      formData.append('phone', phone);
      formData.append('email', email);
      formData.append('dob', dob);
      formData.append('password', password);
      formData.append('aadhar_card', aadharFile);
      formData.append('driving_license', licenseFile);

      const res = await fetch('/api/driver/signup', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const FileUploadBox = ({
    label, icon: Icon, file, inputRef, accept, onChange
  }: {
    label: string;
    icon: any;
    file: File | null;
    inputRef: React.RefObject<HTMLInputElement | null>;
    accept: string;
    onChange: (f: File) => void;
  }) => (
    <div>
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Icon size={14} style={{ color: 'var(--primary)' }} /> {label}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${file ? 'var(--success)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: file ? 'rgba(16, 185, 129, 0.04)' : 'rgba(249, 115, 22, 0.02)',
          transition: 'all 0.2s',
        }}
      >
        {file ? (
          <CheckCircle size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
        ) : (
          <Upload size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        )}
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: file ? 'var(--success)' : 'var(--secondary)' }}>
            {file ? file.name : `Tap to upload ${label}`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {file ? `${(file.size / 1024).toFixed(1)} KB` : 'JPG, PNG or PDF — max 5 MB'}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0]); }}
      />
    </div>
  );

  if (success) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '2rem 1.5rem', backgroundColor: 'var(--bg-color)'
      }}>
        <div className="card auth-floating-card" style={{
          maxWidth: '480px', width: '100%', padding: '2.5rem', textAlign: 'center',
          background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(18px)',
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <CheckCircle size={44} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ color: 'var(--secondary)', marginBottom: '0.75rem' }}>Registration Submitted!</h2>
          <div style={{
            backgroundColor: 'rgba(249, 115, 22, 0.06)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
          }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>
              ⏳ KYC Verification Pending
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Thank you for registering with Viji Drop Taxi. Your documents have been submitted successfully and are currently under review. Our admin team will verify your Aadhar card and Driving License within 1–2 business days. You will be able to log in once your KYC is approved.
            </p>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            If you have any questions, please contact our support team.
          </p>
          <Link href="/driver/login" className="btn btn-primary" style={{ width: '100%', display: 'block' }}>
            Back to Driver Login
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
        width: '100%', maxWidth: '500px', padding: '2.5rem',
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
          <h2 style={{ color: 'var(--secondary)' }}>Driver Registration</h2>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
            Join Viji Drop Taxi as a driver
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={14} style={{ color: 'var(--primary)' }} /> Full Name
            </label>
            <input type="text" className="form-control" placeholder="Enter your full name"
              value={fullName} onChange={(e) => setFullName(e.target.value)}
              style={{ width: '100%' }} required />
          </div>

          {/* Mobile Number */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Phone size={14} style={{ color: 'var(--primary)' }} /> Mobile Number
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{
                padding: '0 0.75rem', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center',
                backgroundColor: 'rgba(30,41,59,0.04)', fontWeight: 600, fontSize: '0.9rem',
                color: 'var(--secondary)', whiteSpace: 'nowrap',
              }}>+91</div>
              <input type="tel" className="form-control" placeholder="10-digit mobile number"
                value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                style={{ flex: 1 }} maxLength={10} required />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} style={{ color: 'var(--primary)' }} /> Email Address
            </label>
            <input type="email" className="form-control" placeholder="driver@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%' }} required />
          </div>

          {/* Date of Birth */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} style={{ color: 'var(--primary)' }} /> Date of Birth
            </label>
            <input type="date" className="form-control"
              value={dob} onChange={(e) => setDob(e.target.value)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              style={{ width: '100%' }} required />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} style={{ color: 'var(--primary)' }} /> Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Create a password (min. 6 characters)"
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

          {/* Document Uploads */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 500 }}>
              📎 KYC DOCUMENTS — Upload clear, readable copies
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <FileUploadBox
                label="Aadhar Card"
                icon={CreditCard}
                file={aadharFile}
                inputRef={aadharRef}
                accept="image/*,.pdf"
                onChange={setAadharFile}
              />
              <FileUploadBox
                label="Driving License"
                icon={FileText}
                file={licenseFile}
                inputRef={licenseRef}
                accept="image/*,.pdf"
                onChange={setLicenseFile}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting}>
            {submitting ? 'Submitting Registration...' : 'Submit for KYC Verification'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <Link href="/driver/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
