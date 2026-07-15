'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Eye, RefreshCw, Clock, UserCheck, UserX, FileText, CreditCard } from 'lucide-react';

type Driver = {
  id: string;
  full_name: string;
  phone: string;
  dob: string;
  kyc_status: 'pending' | 'approved' | 'rejected';
  aadhar_signed_url: string | null;
  license_signed_url: string | null;
  created_at: string;
};

const statusBadge = (status: string) => {
  const styles: Record<string, { bg: string; color: string; label: string; icon: any }> = {
    pending: { bg: 'rgba(251,191,36,0.12)', color: '#D97706', label: 'Pending Review', icon: Clock },
    approved: { bg: 'rgba(16,185,129,0.1)', color: 'var(--success)', label: 'Approved', icon: UserCheck },
    rejected: { bg: 'rgba(239,68,68,0.1)', color: 'var(--error)', label: 'Rejected', icon: UserX },
  };
  const s = styles[status] || styles.pending;
  const Icon = s.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      backgroundColor: s.bg, color: s.color,
      padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)',
      fontSize: '0.78rem', fontWeight: 600,
    }}>
      <Icon size={12} /> {s.label}
    </span>
  );
};

export default function AdminKYCPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const fetchDrivers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/admin/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!profile || profile.role !== 'admin') { router.push('/'); return; }

      const res = await fetch('/api/admin/kyc');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDrivers(data.drivers || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load KYC data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleAction = async (driverId: string, action: 'approve' | 'reject') => {
    setActionLoading(driverId + action);
    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: driverId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDrivers((prev) => prev.map((d) => d.id === driverId ? { ...d, kyc_status: data.kyc_status } : d));
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filter === 'all' ? drivers : drivers.filter((d) => d.kyc_status === filter);
  const counts = {
    all: drivers.length,
    pending: drivers.filter((d) => d.kyc_status === 'pending').length,
    approved: drivers.filter((d) => d.kyc_status === 'approved').length,
    rejected: drivers.filter((d) => d.kyc_status === 'rejected').length,
  };

  return (
    <div style={{ padding: '2rem 0', minHeight: '80vh', backgroundColor: 'var(--bg-color)' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ color: 'var(--secondary)', marginBottom: '0.25rem' }}>Driver KYC Verification</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Review and approve driver document submissions</p>
          </div>
          <button onClick={fetchDrivers} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: filter === f ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: filter === f ? 'var(--primary)' : 'white',
                color: filter === f ? 'white' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        {errorMsg && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}><span>{errorMsg}</span></div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading KYC submissions...</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No {filter === 'all' ? '' : filter} KYC submissions found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map((driver) => (
              <div key={driver.id} className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1.05rem', color: 'var(--secondary)', margin: 0 }}>{driver.full_name}</h3>
                      {statusBadge(driver.kyc_status)}
                    </div>
                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📞 {driver.phone}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        🎂 {driver.dob ? new Date(driver.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        📅 Applied {new Date(driver.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons — only show for pending */}
                  {driver.kyc_status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleAction(driver.id, 'approve')}
                        disabled={!!actionLoading}
                        className="btn btn-sm"
                        style={{
                          backgroundColor: 'var(--success)', color: 'white', border: 'none',
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          opacity: actionLoading === driver.id + 'approve' ? 0.6 : 1,
                        }}
                      >
                        <CheckCircle size={14} />
                        {actionLoading === driver.id + 'approve' ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleAction(driver.id, 'reject')}
                        disabled={!!actionLoading}
                        className="btn btn-sm"
                        style={{
                          backgroundColor: 'var(--error)', color: 'white', border: 'none',
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          opacity: actionLoading === driver.id + 'reject' ? 0.6 : 1,
                        }}
                      >
                        <XCircle size={14} />
                        {actionLoading === driver.id + 'reject' ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Documents */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {driver.aadhar_signed_url ? (
                    <a href={driver.aadhar_signed_url} target="_blank" rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                      <CreditCard size={14} /> View Aadhar Card
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0.35rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                      Aadhar: Not uploaded
                    </span>
                  )}
                  {driver.license_signed_url ? (
                    <a href={driver.license_signed_url} target="_blank" rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                      <FileText size={14} /> View Driving License
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0.35rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                      License: Not uploaded
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
