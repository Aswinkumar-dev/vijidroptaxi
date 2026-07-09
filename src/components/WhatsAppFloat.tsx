'use client';

import React from 'react';

export default function WhatsAppFloat() {
  const phoneNumber = '916382882740'; // 6382882740 with +91 country prefix
  const message = encodeURIComponent("Hello! I want to book a ride with Viji Drop Taxi.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

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
