'use client';

import React from 'react';
import Link from 'next/link';
import { Home, MapPin, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '85vh',
      padding: '3rem 1.5rem',
      backgroundColor: 'var(--bg-color, #f8fafc)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Grid Pattern Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(var(--border-color, #e2e8f0) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.5,
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '560px',
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Animated Map Pin */}
        <div style={{
          position: 'relative',
          width: '80px',
          height: '80px',
          margin: '0 auto 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Pulsing ring */}
          <div 
            className="animate-ping-custom"
            style={{
              position: 'absolute',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: '2.5px solid var(--primary, #f97316)',
              opacity: 0.75
            }} 
          />
          <MapPin 
            size={48} 
            className="animate-bounce-pin"
            style={{ 
              color: 'var(--primary, #f97316)', 
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))'
            }} 
          />
        </div>

        {/* 404 Heading */}
        <h1 style={{
          fontSize: '5.5rem',
          fontWeight: 900,
          color: 'var(--secondary, #0f172a)',
          lineHeight: 1,
          margin: 0,
          letterSpacing: '-0.03em',
          textShadow: '2px 2px 0px rgba(249, 115, 22, 0.15)'
        }}>
          404
        </h1>

        <h2 style={{
          fontSize: '1.65rem',
          fontWeight: 800,
          color: 'var(--secondary, #0f172a)',
          marginTop: '0.5rem',
          marginBottom: '1rem',
          letterSpacing: '-0.02em'
        }}>
          Wrong Turn? Route Not Found!
        </h2>

        <p style={{
          fontSize: '0.95rem',
          color: 'var(--text-muted, #64748b)',
          lineHeight: 1.6,
          maxWidth: '420px',
          margin: '0 auto 2.5rem'
        }}>
          It looks like you've driven off the map. This destination doesn't exist or has been relocated. Let's get you back on the right road!
        </p>

        {/* Idling Car & Road Graphic */}
        <div style={{
          position: 'relative',
          width: '260px',
          height: '100px',
          margin: '0 auto 2.5rem',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}>
          {/* Idling Car */}
          <img 
            src="/assets/sedan car.png" 
            alt="Idling Taxi" 
            className="animate-engine-idle"
            style={{
              width: '170px',
              height: 'auto',
              objectFit: 'contain',
              zIndex: 2,
              filter: 'drop-shadow(0 8px 12px rgba(15, 23, 42, 0.15))'
            }} 
          />

          {/* Road line */}
          <div style={{
            position: 'absolute',
            bottom: '4px',
            left: '10%',
            right: '10%',
            height: '4px',
            backgroundColor: 'var(--secondary, #0f172a)',
            borderRadius: '2px',
            zIndex: 1,
            boxShadow: '0 4px 10px rgba(15, 23, 42, 0.2)'
          }} />
          
          {/* Dash Road Markers */}
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            left: '20%',
            right: '20%',
            height: '2px',
            backgroundImage: 'linear-gradient(to right, var(--secondary, #0f172a) 50%, transparent 50%)',
            backgroundSize: '16px 2px',
            zIndex: 1,
            opacity: 0.6
          }} />
        </div>

        {/* Actions Button Grid */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '1rem',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Link 
            href="/book" 
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.75rem',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
              borderRadius: 'var(--radius-md, 8px)',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            Book a Ride <ArrowRight size={16} />
          </Link>
          
          <Link 
            href="/" 
            className="btn btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.75rem',
              borderRadius: 'var(--radius-md, 8px)',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <Home size={16} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
