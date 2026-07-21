'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown, ChevronUp, Mail, Phone } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "How can I book a cab online?",
    answer: "Booking a cab is quick and easy. Enter your pickup location, destination, travel date, and preferred cab type on our website. Once you confirm your booking, you'll receive instant confirmation along with your driver's details before the trip."
  },
  {
    question: "How much does a taxi ride cost?",
    answer: "Taxi fares depend on the distance, vehicle type, travel duration, and route. Our pricing is transparent with no hidden charges. You can check the estimated fare before confirming your booking."
  },
  {
    question: "Can I book a cab for airport pickup and drop?",
    answer: "Yes. We provide 24/7 airport taxi services for both pickups and drop-offs. You can schedule your ride in advance, and our driver will arrive on time with real-time flight tracking for airport pickups."
  },
  {
    question: "Do you provide outstation cab services?",
    answer: "Yes. We offer one-way and round-trip outstation taxi services to major cities and tourist destinations. Our outstation cabs are comfortable, affordable, and driven by experienced professional drivers."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept Cash, UPI, Google Pay, PhonePe, Paytm, debit cards, credit cards, and online payments. You can choose your preferred payment option during or after your ride."
  },
  {
    question: "Is it possible to cancel or reschedule my cab booking?",
    answer: "Yes. You can cancel or reschedule your booking before your scheduled pickup time. Cancellation policies may vary depending on the booking type. Please contact our support team if you need assistance."
  },
  {
    question: "Are your taxi drivers verified and experienced?",
    answer: "Absolutely. Every driver is professionally trained, background verified, and holds a valid commercial driving license. Your safety and comfort are our highest priorities."
  },
  {
    question: "Can I book a cab for corporate or business travel?",
    answer: "At the moment, we do not provide corporate cab or business travel services. Our focus is on delivering reliable local, airport, and outstation taxi services for individual travelers and families."
  },
  {
    question: "Are your cab prices fixed or do they change?",
    answer: "Our fares are calculated based on distance, vehicle category, and travel requirements. You'll receive the estimated fare before booking, ensuring complete pricing transparency without hidden fees."
  },
  {
    question: "Why should I choose your cab service?",
    answer: "We provide affordable pricing, professional drivers, clean and sanitized vehicles, 24/7 customer support, on-time pickups, secure online booking, and reliable transportation for local, airport, and outstation travel."
  }
];

export default function FAQPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

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
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
            <span style={{
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-full)',
              color: 'var(--primary)',
              display: 'inline-flex',
              marginBottom: '1rem'
            }}>
              <HelpCircle size={32} />
            </span>
            <h1 style={{ color: 'var(--secondary)', marginBottom: '0.5rem', fontSize: '2.5rem' }}>Frequently Asked Questions</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Find answers to common questions about booking, pricing, cancellation, and services.
            </p>
          </div>

          {/* Accordion Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
            {faqData.map((item, index) => {
              const isOpen = activeIndex === index;
              return (
                <div 
                  key={index} 
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 4px 12px rgba(249, 115, 22, 0.04)' : 'none',
                    borderColor: isOpen ? 'var(--primary)' : 'var(--border-color)',
                    backgroundColor: isOpen ? 'rgba(249, 115, 22, 0.01)' : 'white'
                  }}
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    style={{
                      width: '100%',
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: isOpen ? 'var(--primary)' : 'var(--secondary)',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      fontFamily: 'inherit',
                      gap: '1rem'
                    }}
                  >
                    <span>{index + 1}. {item.question}</span>
                    {isOpen ? (
                      <ChevronUp size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    ) : (
                      <ChevronDown size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    )}
                  </button>
                  
                  <div 
                    style={{
                      maxHeight: isOpen ? '300px' : '0px',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      borderTop: isOpen ? '1px solid var(--border-color)' : '1px solid transparent'
                    }}
                  >
                    <div style={{ padding: '1.25rem 1.5rem', color: 'var(--text-color)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                      {item.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Need Support Panel */}
          <section style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ color: 'var(--secondary)', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 700 }}>
              Still Have Questions?
            </h2>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              If you couldn't find the answers you were looking for, please contact our support team. We are available 24/7 to assist you.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} style={{ color: 'var(--primary)' }} />
                <strong>Email:</strong> <a href="mailto:vijayakumarr782@gmail.com" style={{ color: 'var(--primary)' }}>vijayakumarr782@gmail.com</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} style={{ color: 'var(--primary)' }} />
                <strong>Phone:</strong> <a href="tel:+916382882740" style={{ color: 'var(--primary)' }}>+91 63828 82740</a>
              </div>
            </div>
          </section>

          {/* Back Button */}
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
