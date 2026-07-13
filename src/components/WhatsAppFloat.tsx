'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function WhatsAppFloat() {
  const pathname = usePathname();
  const phoneNumber = '916382882740'; // 6382882740 with +91 country prefix
  const message = encodeURIComponent("Hello! I want to book a ride with Viji Drop Taxi.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  // Hide on booking and ride tracking pages
  if (pathname?.startsWith('/book') || pathname?.startsWith('/rides')) {
    return null;
  }

  return (
    <a 
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float-container"
      title="Book a ride on WhatsApp"
    >
      <div className="whatsapp-tooltip">
        💬 Book your ride!
      </div>
      <div className="whatsapp-icon-btn">
        <img src="/assets/whatsapp.png" alt="WhatsApp logo" />
      </div>
    </a>
  );
}

