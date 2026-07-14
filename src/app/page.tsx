'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Car, MapPin, ShieldCheck, Clock, Award, Star, Phone, Mail, ArrowRight, Calculator } from 'lucide-react';
const HatchbackIcon = ({ active }: { active: boolean }) => (
  <img
    src="/assets/hatchback.png"
    alt="Hatchback"
    className="car-icon-hatchback"
    style={{
      objectFit: 'contain',
      filter: active 
        ? 'brightness(0) invert(1)' 
        : 'invert(53%) sepia(85%) saturate(1518%) hue-rotate(346deg) brightness(101%) contrast(96%)',
      transition: 'filter 0.3s'
    }}
  />
);

const SedanIcon = ({ active }: { active: boolean }) => (
  <img
    src="/assets/sedan-car.png"
    alt="Sedan"
    className="car-icon-sedan"
    style={{
      objectFit: 'contain',
      filter: active 
        ? 'brightness(0) invert(1)' 
        : 'invert(53%) sepia(85%) saturate(1518%) hue-rotate(346deg) brightness(101%) contrast(96%)',
      transition: 'filter 0.3s'
    }}
  />
);

const SUVIcon = ({ active }: { active: boolean }) => (
  <img
    src="/assets/suv-car.png"
    alt="SUV"
    className="car-icon-suv"
    style={{
      objectFit: 'contain',
      filter: active 
        ? 'brightness(0) invert(1)' 
        : 'invert(53%) sepia(85%) saturate(1518%) hue-rotate(346deg) brightness(101%) contrast(96%)',
      transition: 'filter 0.3s'
    }}
  />
);
export default function Home() {
  const [distance, setDistance] = useState<number>(50);
  const [carType, setCarType] = useState<'hatchback' | 'sedan' | 'suv'>('sedan');
  const [rideType, setRideType] = useState<'one_way' | 'round_trip'>('one_way');
  const [hasAC, setHasAC] = useState<boolean>(true);
  const [fareRules, setFareRules] = useState<any[]>([]);
  const [estimate, setEstimate] = useState<number>(0);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactName.trim().length < 2) {
      alert('Full Name must be at least 2 characters long.');
      return;
    }
    if (contactPhone.length !== 10) {
      alert('Phone number must be exactly 10 digits (numbers only).');
      return;
    }

    alert('Thank you! Your message has been received. Our coordinator will contact you shortly.');
    setContactName('');
    setContactPhone('');
    setContactMessage('');
  };

  useEffect(() => {
    // Fetch fare rules from Supabase
    const fetchFareRules = async () => {
      const { data, error } = await supabase
        .from('fare_rules')
        .select('*');
      if (!error && data) {
        setFareRules(data);
      }
    };
    fetchFareRules();
  }, []);

  // Get active rate per KM based on car type and A/C selection
  const getPerKmRate = () => {
    if (carType === 'hatchback') {
      return hasAC ? 13 : 12;
    } else if (carType === 'sedan') {
      return hasAC ? 15 : 14;
    } else if (carType === 'suv') {
      return hasAC ? 21 : 20;
    }
    return 15;
  };

  const perKmRate = getPerKmRate();

  useEffect(() => {
    let calculatedFare = distance * perKmRate;
    if (rideType === 'round_trip') {
      calculatedFare = calculatedFare * 2;
    }
    setEstimate(calculatedFare);
  }, [distance, carType, rideType, hasAC, perKmRate]);

  return (
    <div style={{ fontFamily: 'var(--font-secondary)' }}>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container-grid">
          <div className="hero-text-align">
            <span className="hero-badge-align animate-fade-in-up" style={{
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              color: 'var(--primary)',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '1.5rem'
            }}>
              Your journey our priority
            </span>
            <h1 className="hero-title animate-fade-in-up delay-100" style={{ marginBottom: '1.5rem', color: 'var(--secondary)', lineHeight: 1.25 }}>
              Reliable, Comfortable & <span style={{ color: 'var(--primary)' }}>Affordable Drop Taxi</span>
            </h1>
            <p className="hero-subtitle-left animate-fade-in-up delay-200">
              Travel in clean, comfortable cars with professional drivers and transparent pricing. Book your ride in minutes.
            </p>
            <div className="hero-cta-left animate-fade-in-up delay-300">
              <Link href="/book" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                Book Your Ride Now <ArrowRight size={20} />
              </Link>
              <a href="#estimator" className="btn btn-secondary btn-lg">
                Check Fare Estimate
              </a>
            </div>
          </div>

          <div className="hero-image-wrapper animate-scale-in delay-200">
            <img
              src="/assets/hero%20image.webp"
              alt="Viji Drop Taxi Hero"
              className="hero-image-img"
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" style={{ padding: '5rem 0', backgroundColor: 'white' }}>
        <div className="container">
          <div className="section-title">
            <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>What We Offer</span>
            <h2>Our Specialized Services</h2>
            <p style={{ maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>We specialize in intercity travel with customizable booking modes that save you up to 50% compared to typical two-way charges.</p>
          </div>

          <div className="grid-cols-3">
            <div className="card card-hover" style={{ textAlign: 'center' }}>
              <div style={{
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                color: 'var(--primary)'
              }}>
                <MapPin size={32} />
              </div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>One-Way Taxi</h3>
              <p>Book a reliable one-way drop taxi and pay only for the distance you travel. No return fare or hidden charges. Perfect for outstation travel, airport drops, and railway station transfers.</p>
            </div>

            <div className="card card-hover" style={{ textAlign: 'center' }}>
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.05)',
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                color: 'var(--secondary)'
              }}>
                <Car size={32} />
              </div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Round-Trip Cab</h3>
              <p>Enjoy flexible multi-day outstation bookings. Driver allowance included, tailored for sightseeing, corporate visits, and family tours.</p>
            </div>

            <div className="card card-hover" style={{ textAlign: 'center' }}>
              <div style={{
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                color: 'var(--accent)'
              }}>
                <ShieldCheck size={32} />
              </div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Verified Fleet</h3>
              <p>A specialized small fleet of active vehicles including Hatchbacks, Sedans, and SUVs, maintained to strict safety, cooling, and hygiene logs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fare Estimator Section */}
      <section id="estimator" style={{ padding: '5rem 0', backgroundColor: 'var(--bg-color)' }}>
        <div className="container">
          <div className="section-title">
            <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instant Estimates</span>
            <h2>Transparent Fare Estimator</h2>
            <p>Know exactly what you pay before booking. No hidden charges, toll fares not included.</p>
          </div>

          <div style={{
            maxWidth: '850px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '2rem',
            alignItems: 'center'
          }} className="grid-2">
            
            {/* Input Panel */}
            <div className="card" style={{ padding: '2.5rem' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)' }}>
                <Calculator style={{ color: 'var(--primary)' }} /> Select Ride Details
              </h3>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Car Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {(['hatchback', 'sedan', 'suv'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`btn ${carType === type ? 'btn-primary' : 'btn-ghost'}`}
                      style={{
                        border: carType === type ? '1px solid var(--primary)' : '1px solid #94A3B8',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.1rem',
                        padding: '0.2rem 0.1rem',
                        height: '82px'
                      }}
                      onClick={() => setCarType(type)}
                    >
                      {type === 'hatchback' && <HatchbackIcon active={carType === type} />}
                      {type === 'sedan' && <SedanIcon active={carType === type} />}
                      {type === 'suv' && <SUVIcon active={carType === type} />}
                      <span>{type === 'suv' ? 'SUV' : type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Ride Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${rideType === 'one_way' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ border: rideType === 'one_way' ? '1px solid var(--primary)' : '1px solid #94A3B8' }}
                    onClick={() => setRideType('one_way')}
                  >
                    One Way Drop
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${rideType === 'round_trip' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ border: rideType === 'round_trip' ? '1px solid var(--primary)' : '1px solid #94A3B8' }}
                    onClick={() => setRideType('round_trip')}
                  >
                    Round Trip
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">A/C Option</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${hasAC ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ border: hasAC ? '1px solid var(--primary)' : '1px solid #94A3B8' }}
                    onClick={() => setHasAC(true)}
                  >
                    With A/C
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${!hasAC ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ border: !hasAC ? '1px solid var(--primary)' : '1px solid #94A3B8' }}
                    onClick={() => setHasAC(false)}
                  >
                    Without A/C
                  </button>
                </div>
              </div>

              {/* Dynamic Price Info Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(249, 115, 22, 0.05)',
                border: '1px dashed var(--primary)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.9rem'
              }}>
                <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>Price per KM:</span>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>₹{perKmRate} / KM</span>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Distance: {distance} KM</label>
                <input
                  type="range"
                  min="10"
                  max="600"
                  step="5"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--primary)',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>10 KM</span>
                  <span>300 KM</span>
                  <span>600 KM</span>
                </div>
              </div>
            </div>

            {/* Quote Output Panel */}
            <div className="card" style={{
              backgroundColor: 'var(--secondary)',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '3rem 2rem',
              textAlign: 'center'
            }}>
              <span style={{ textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                Estimated Fare
              </span>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'white', margin: '0.5rem 0' }}>
                ₹{estimate.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '2rem', maxWidth: '300px', lineHeight: '1.5' }}>
                {rideType === 'one_way' ? (
                  `Estimated for ${distance} KM at ₹${perKmRate}/KM using a ${carType} (${hasAC ? 'With A/C' : 'Without A/C'}) for a one-way drop.`
                ) : (
                  `Estimated for ${distance} KM one-way (total ${distance * 2} KM round-trip) at ₹${perKmRate}/KM using a ${carType} (${hasAC ? 'With A/C' : 'Without A/C'}).`
                )}
              </p>
              <Link href={`/book?car_type=${carType}&ride_type=${rideType}&distance=${distance}&has_ac=${hasAC}`} className="btn btn-primary" style={{ width: '100%' }}>
                Book This Ride Now
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{ padding: '5rem 0', backgroundColor: 'white' }}>
        <div className="container grid-2" style={{ alignItems: 'center', gap: '3rem' }}>
          <div>
            <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Who We Are</span>
            <h2 style={{ fontSize: '2.25rem', marginBottom: '1.5rem', color: 'var(--secondary)' }}>Personalized, Trustworthy, Safe</h2>
            <p style={{ marginBottom: '1.25rem' }}>
              Unlike large taxi companies, Viji Drop Taxi works with a small and trusted fleet of vehicles. This helps us personally check every car and choose experienced, professional drivers for every trip.
            </p>
            <p style={{ marginBottom: '2rem' }}>
              Every booking and driver assignment is carefully managed by our team. We make sure you travel with trusted drivers and clean, well-maintained, air-conditioned cars for a safe and comfortable journey.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock size={20} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>24/7 Dispatch</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Award size={20} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>Punctuality Guaranteed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Star size={20} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>4.9/5 Rating Avg</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>Professional Drivers</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              border: '8px solid white',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              backgroundColor: 'var(--secondary)',
              color: 'white',
              padding: '3rem',
              maxWidth: '450px'
            }}>
              <h3 style={{ color: 'var(--accent)', fontSize: '1.75rem', marginBottom: '1rem', fontFamily: 'var(--font-primary)' }}>Why Choose Us?</h3>
              <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0 }}>
                <li style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>✓</span>
                  <span>No sudden surge pricing or hidden peak charges</span>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>✓</span>
                  <span>Highly cleaned and sanitized air-conditioned fleet</span>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>✓</span>
                  <span>Manual tracking by customer service coordinators</span>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>✓</span>
                  <span>No payment disputes - exact fare provided at booking confirmation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ padding: '5rem 0', backgroundColor: 'var(--bg-color)' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div className="section-title">
            <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Have Questions?</span>
            <h2>Get In Touch With Us</h2>
            <p>Connect with our 24/7 helpdesk. We will help coordinate your travel bookings and corporate contracts.</p>
          </div>

          <div className="grid-2" style={{ gap: '2rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center' }}>
              <h3 style={{ color: 'var(--secondary)' }}>Contact Information</h3>
              <p>For urgent booking support or changes to active rides, call our helpline numbers directly.</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  backgroundColor: 'rgba(249, 115, 22, 0.1)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--primary)'
                }}>
                  <Phone size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Helpline Phone</div>
                  <div style={{ fontWeight: 700, color: 'var(--secondary)', lineHeight: '1.4' }}>
                    +91 63828 82740 <br />
                    +91 63848 19045
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.05)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--secondary)'
                }}>
                  <Mail size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email Address</div>
                  <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>vijaykumarr782@gmail.com</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>Send an Inquiry</h3>
              <form onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="John Doe"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number <span style={{ color: 'red' }}>*</span></label>
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
                      placeholder="99999 99999"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Ask about bookings, schedules, or pricing rules (optional)..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
