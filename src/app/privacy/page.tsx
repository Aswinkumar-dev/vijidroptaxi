'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';

export default function PrivacyPolicy() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentMonthYear = mounted
    ? new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    : 'July 2026';

  return (
    <div style={{
      padding: '4rem 1.5rem',
      backgroundColor: 'var(--bg-color)',
      minHeight: 'calc(100vh - var(--header-height) - 300px)',
      color: 'var(--text-color)',
      fontFamily: 'var(--font-secondary)'
    }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="card" style={{ padding: '3rem', lineHeight: '1.8' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
            <span style={{
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-full)',
              color: 'var(--primary)',
              display: 'inline-flex',
              marginBottom: '1rem'
            }}>
              <ShieldCheck size={32} />
            </span>
            <h1 style={{ color: 'var(--secondary)', marginBottom: '0.5rem', fontSize: '2.5rem' }}>Privacy Policy</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Calendar size={14} /> Last Updated: {currentMonthYear}
            </p>
          </div>

          <section style={{ marginBottom: '2rem' }}>
            <p>
              At <strong>Viji Drop Taxi</strong>, we value your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains what information we collect, how we use it, and how we protect it.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--secondary)', fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              Information We Collect
            </h2>
            <p>When you book a ride through our website, we may collect the following information:</p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
              <li>Full Name</li>
              <li>Email Address</li>
              <li>Mobile Number</li>
            </ul>
            <p>
              We also store the details related to your ride booking, including the ride date, pickup and drop locations, and other booking information.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--secondary)', fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              How We Use Your Information
            </h2>
            <p>The information collected is used only for the following purposes:</p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
              <li>To confirm your ride booking.</li>
              <li>To contact you regarding your booking if necessary.</li>
              <li>To maintain ride records for operational purposes.</li>
              <li>To help the cab owner and our team verify past bookings, including the date and details of completed rides.</li>
            </ul>
            <p>Your information is not used for marketing or any unrelated purpose.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--secondary)', fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              Data Sharing
            </h2>
            <p>We respect your privacy.</p>
            <p>
              Your personal information will not be sold, rented, or shared with any third party except when required by law or when necessary to complete your requested taxi service.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--secondary)', fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              Data Security
            </h2>
            <p>
              We take reasonable measures to protect your personal information from unauthorized access, misuse, or disclosure. While no online system can guarantee complete security, we strive to keep your information safe.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--secondary)', fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              Data Retention
            </h2>
            <p>
              We retain your booking information only for maintaining ride records and providing customer support when needed. This helps us verify previous bookings and manage our taxi services efficiently.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--secondary)', fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              Your Rights
            </h2>
            <p>You may contact us at any time to:</p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
              <li>Request access to your stored information.</li>
              <li>Request correction of incorrect information.</li>
              <li>Request deletion of your personal information, where applicable.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--secondary)', fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with the updated effective date.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ color: 'var(--secondary)', fontSize: '1.25rem', marginBottom: '0.75rem' }}>
              Contact Us
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              If you have any questions regarding this Privacy Policy or your personal information, please contact us:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} style={{ color: 'var(--primary)' }} />
                <strong>Email:</strong> <a href="mailto:vijayakumarr782@gmail.com" style={{ color: 'var(--primary)' }}>vijayakumarr782@gmail.com</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} style={{ color: 'var(--primary)' }} />
                <strong>Phone:</strong> <a href="tel:+916382882740" style={{ color: 'var(--primary)' }}>+91 6382882740</a>
              </div>
            </div>
          </section>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/" className="btn btn-outline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
