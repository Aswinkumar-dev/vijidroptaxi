'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Phone } from 'lucide-react';

export default function WhatsAppFloat() {
  const pathname = usePathname();
  const phoneNumber = '916382882740';
  const callNumber = '+916382882740';
  const message = encodeURIComponent(
`Hello Viji Drop Taxi,

I would like to book a taxi.

Pickup:
Destination:
Travel Date:

Please share the estimated fare and vehicle availability.`
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  // Hide on booking and ride tracking pages
  if (pathname?.startsWith('/book') || pathname?.startsWith('/rides')) {
    return null;
  }

  return (
    <div className="floating-buttons-container">
      {/* Call Button */}
      <a
        href={`tel:${callNumber}`}
        className="call-float-btn"
        title="Call us now"
      >
        <Phone size={26} strokeWidth={2.5} />
      </a>

      {/* WhatsApp Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-icon-btn"
        title="Chat on WhatsApp"
      >
        <img src="/assets/whatsapp.png" alt="WhatsApp logo" />
      </a>
    </div>
  );
}
