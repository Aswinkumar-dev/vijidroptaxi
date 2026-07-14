import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: 'var(--secondary)',
      color: '#E2E8F0',
      padding: '4rem 0 2rem 0',
      borderTop: '4px solid var(--primary)',
      fontFamily: 'var(--font-secondary)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-primary)', letterSpacing: '-0.02em' }}>
                Viji Drop Taxi
              </span>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: '1.6', textAlign: 'left' }}>
              Your trusted choice for one-way and round-trip taxi services, with clean vehicles, reliable service, and comfortable rides.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'white', marginBottom: '1.25rem', fontFamily: 'var(--font-primary)', fontSize: '1.1rem' }}>
              Quick Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <Link href="/" className="footer-link">Home</Link>
              <Link href="/#about" className="footer-link">About</Link>
              <Link href="/#services" className="footer-link">Services</Link>
              <Link href="/#contact" className="footer-link">Contact</Link>
              <Link href="/book" className="footer-link">Book a Ride</Link>
              <Link href="/privacy" className="footer-link">Privacy Policy</Link>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'white', marginBottom: '1.25rem', fontFamily: 'var(--font-primary)', fontSize: '1.1rem' }}>
              Our Services
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#94A3B8' }}>
              <span>One-way Intercity Drops</span>
              <span>Round-trip Outstation Rides</span>
              <span>Airport Pickups & Drops</span>
              <span>Premium Fleet (Sedan, SUV, Hatchback)</span>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'white', marginBottom: '1.25rem', fontFamily: 'var(--font-primary)', fontSize: '1.1rem' }}>
              Contact Us
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#94A3B8' }}>
              <span>📍 16, Somavur Kizhpathi Street, Kalinjukuppam, Viluppuram, Tamil Nadu</span>
              <span>📞 +91 63828 82740 / +91 63848 19045</span>
              <span>✉️ vijaykumarr782@gmail.com</span>
              <span>⏰ 24/7 Service Available</span>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid #334155',
          paddingTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#64748B',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>© {new Date().getFullYear()} Viji Drop Taxi. All rights reserved.</span>
          <span>Designed by Webgrat.</span>
        </div>
      </div>
    </footer>
  );
}
