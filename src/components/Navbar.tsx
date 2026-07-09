'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut, User, Menu, X, MapPin } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile in Navbar:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  // Determine navbar links based on role
  const renderLinks = () => {
    if (!session) {
      return (
        <>
          <Link href="/" className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}>Home</Link>
          <Link href="/#about" className="nav-link">About</Link>
          <Link href="/#services" className="nav-link">Services</Link>
          <Link href="/#contact" className="nav-link">Contact</Link>
          <Link href="/book" className="btn btn-primary btn-sm" style={{ boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)' }}>Book Now</Link>
          <Link href="/login" className="btn btn-outline btn-sm">Login</Link>
        </>
      );
    }

    if (profile?.role === 'admin') {
      return (
        <>
          <Link href="/admin/dashboard" className={`nav-link ${isActive('/admin/dashboard') ? 'nav-link-active' : ''}`}>Dashboard</Link>
          <Link href="/admin/bookings" className={`nav-link ${isActive('/admin/bookings') ? 'nav-link-active' : ''}`}>Bookings</Link>
          <Link href="/admin/drivers" className={`nav-link ${isActive('/admin/drivers') ? 'nav-link-active' : ''}`}>Drivers</Link>
          <Link href="/admin/cars" className={`nav-link ${isActive('/admin/cars') ? 'nav-link-active' : ''}`}>Cars</Link>
          <Link href="/admin/pricing" className={`nav-link ${isActive('/admin/pricing') ? 'nav-link-active' : ''}`}>Pricing</Link>
          <Link href="/admin/reviews" className={`nav-link ${isActive('/admin/reviews') ? 'nav-link-active' : ''}`}>Reviews</Link>
          <div className="user-pill" onClick={handleLogout} style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </div>
        </>
      );
    }

    if (profile?.role === 'driver') {
      return (
        <>
          <Link href="/driver/dashboard" className={`nav-link ${isActive('/driver/dashboard') ? 'nav-link-active' : ''}`}>Dashboard</Link>
          <Link href="/driver/history" className={`nav-link ${isActive('/driver/history') ? 'nav-link-active' : ''}`}>History</Link>
          <Link href="/driver/profile" className={`nav-link ${isActive('/driver/profile') ? 'nav-link-active' : ''}`}>Profile</Link>
          <div className="user-pill" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </div>
        </>
      );
    }

    // Customer links (default)
    return (
      <>
        <Link href="/" className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}>Home</Link>
        <Link href="/book" className={`nav-link ${isActive('/book') ? 'nav-link-active' : ''}`}>Book Ride</Link>
        <Link href="/rides" className={`nav-link ${isActive('/rides') ? 'nav-link-active' : ''}`}>My Rides</Link>
        <Link href="/profile" className={`nav-link ${isActive('/profile') ? 'nav-link-active' : ''}`}>Profile</Link>
        <div className="user-pill" onClick={handleLogout}>
          <User size={16} />
          <span>{profile?.full_name?.split(' ')[0] || 'Account'}</span>
        </div>
      </>
    );
  };

  return (
    <header className="navbar-header">
      <div className="nav-container">
        <Link href="/" className="logo-link" style={{ marginLeft: '-0.75rem' }}>
          <img src="/assets/viji%20drop%20taxi%20without%20bg.png" alt="Viji Drop Taxi" className="logo-img" />
        </Link>

        {/* Desktop Links */}
        <nav className="nav-links">
          {renderLinks()}
        </nav>

        {/* Mobile Toggle */}
        <button className="mobile-nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={32} /> : <Menu size={32} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div style={{
          position: 'absolute',
          top: 'var(--header-height)',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderBottom: '1px solid var(--border-color)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          zIndex: 99,
          boxShadow: 'var(--shadow-md)'
        }}>
          {!session ? (
            <>
              <Link href="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link href="/#about" className="nav-link" onClick={() => setMenuOpen(false)}>About</Link>
              <Link href="/#services" className="nav-link" onClick={() => setMenuOpen(false)}>Services</Link>
              <Link href="/#contact" className="nav-link" onClick={() => setMenuOpen(false)}>Contact</Link>
              <Link href="/book" className="btn btn-primary" onClick={() => setMenuOpen(false)}>Book Now</Link>
              <Link href="/login" className="btn btn-outline" onClick={() => setMenuOpen(false)}>Login</Link>
            </>
          ) : profile?.role === 'admin' ? (
            <>
              <Link href="/admin/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link href="/admin/bookings" className="nav-link" onClick={() => setMenuOpen(false)}>Bookings</Link>
              <Link href="/admin/drivers" className="nav-link" onClick={() => setMenuOpen(false)}>Drivers</Link>
              <Link href="/admin/cars" className="nav-link" onClick={() => setMenuOpen(false)}>Cars</Link>
              <Link href="/admin/pricing" className="nav-link" onClick={() => setMenuOpen(false)}>Pricing</Link>
              <Link href="/admin/reviews" className="nav-link" onClick={() => setMenuOpen(false)}>Reviews</Link>
              <button className="btn btn-outline" onClick={handleLogout}>Sign Out</button>
            </>
          ) : profile?.role === 'driver' ? (
            <>
              <Link href="/driver/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link href="/driver/history" className="nav-link" onClick={() => setMenuOpen(false)}>History</Link>
              <Link href="/driver/profile" className="nav-link" onClick={() => setMenuOpen(false)}>Profile</Link>
              <button className="btn btn-outline" onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link href="/book" className="nav-link" onClick={() => setMenuOpen(false)}>Book Ride</Link>
              <Link href="/rides" className="nav-link" onClick={() => setMenuOpen(false)}>My Rides</Link>
              <Link href="/profile" className="nav-link" onClick={() => setMenuOpen(false)}>Profile</Link>
              <button className="btn btn-outline" onClick={handleLogout}>Sign Out</button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
