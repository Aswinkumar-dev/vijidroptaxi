'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FileText, MapPin, Calendar, Clock, Car, CheckCircle, ArrowLeft } from 'lucide-react';

function ConfirmBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [fareRule, setFareRule] = useState<any>(null);
  const [calculation, setCalculation] = useState({
    baseFare: 0,
    perKmRate: 0,
    allowance: 0,
    distanceKm: 0,
    totalFare: 0
  });

  // Parse parameters
  const carType = searchParams.get('car_type') || 'sedan';
  const rideType = searchParams.get('ride_type') || 'one_way';
  const pickupAddress = searchParams.get('pickup_address') || '';
  const dropAddress = searchParams.get('drop_address') || '';
  const scheduledAt = searchParams.get('scheduled_at') || '';
  const distanceKm = Number(searchParams.get('distance_km') || '50');
  const paymentMode = searchParams.get('payment_mode') || 'cash';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      }
    });

    const fetchFareRule = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('fare_rules')
        .select('*')
        .eq('car_type', carType)
        .eq('ride_type', rideType)
        .order('applicable_from', { ascending: false })
        .limit(1)
        .maybeSingle();

      let base = 100;
      let rate = 15;
      let allowance = 0;

      if (!error && data) {
        setFareRule(data);
        base = Number(data.base_fare);
        rate = Number(data.per_km_rate);
        allowance = Number(data.driver_allowance || 0);
      } else {
        // Fallbacks
        if (carType === 'hatchback') {
          base = 80;
          rate = 12;
        } else if (carType === 'suv') {
          base = 150;
          rate = 20;
          if (rideType === 'round_trip') allowance = 300;
        } else {
          base = 100;
          rate = 15;
          if (rideType === 'round_trip') allowance = 250;
        }
      }

      setCalculation({
        baseFare: base,
        perKmRate: rate,
        allowance,
        distanceKm,
        totalFare: base + (distanceKm * rate) + allowance
      });
      setLoading(false);
    };

    fetchFareRule();
  }, [carType, rideType, distanceKm]);

  const handleConfirm = async () => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ride_type: rideType,
          pickup_address: pickupAddress,
          drop_address: dropAddress,
          scheduled_at: scheduledAt,
          car_type: carType,
          distance_km: distanceKm,
          payment_mode: paymentMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place booking.');
      }

      // Success - Redirect to ride status page
      router.push(`/rides/${data.id}?msg=Booking placed successfully!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while placing booking.');
      setSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ padding: '3rem 0', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '650px' }}>
        
        {/* Step Indicator */}
        <div className="steps-container">
          <div className="steps-progress" style={{ width: '50%' }}></div>
          <div className="step-node completed">
            <div className="step-circle">1</div>
            <span className="step-label">Ride Details</span>
          </div>
          <div className="step-node active">
            <div className="step-circle">2</div>
            <span className="step-label">Confirmation</span>
          </div>
          <div className="step-node">
            <div className="step-circle">3</div>
            <span className="step-label">Status</span>
          </div>
        </div>

        <button onClick={() => router.back()} className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <ArrowLeft size={16} /> Modify Details
        </button>

        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="receipt-box">
          <div className="receipt-header">
            <FileText size={32} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
            <h2 style={{ color: 'var(--secondary)' }}>Booking Summary</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Confirm your drop details and fare breakdown</span>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              Ride Information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <MapPin size={16} style={{ color: 'var(--primary)', marginTop: '0.25rem' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pickup Location</div>
                  <div style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '0.95rem' }}>{pickupAddress}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <MapPin size={16} style={{ color: 'var(--success)', marginTop: '0.25rem' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Drop Location</div>
                  <div style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '0.95rem' }}>{dropAddress}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date</div>
                    <div style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '0.85rem' }}>{formatDate(scheduledAt)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time</div>
                    <div style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '0.85rem' }}>{formatTime(scheduledAt)}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Car size={16} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fleet Selected</div>
                    <div style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                      {carType} ({rideType === 'one_way' ? 'One Way' : 'Round Trip'})
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={16} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payment Selected</div>
                    <div style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                      {paymentMode.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              Fare Breakdown
            </h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>Recalculating rates...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="receipt-row">
                  <span>Base Booking Fare</span>
                  <span>₹{calculation.baseFare.toFixed(2)}</span>
                </div>
                <div className="receipt-row">
                  <span>Distance Charge ({calculation.distanceKm} KM × ₹{calculation.perKmRate}/KM)</span>
                  <span>₹{(calculation.distanceKm * calculation.perKmRate).toFixed(2)}</span>
                </div>
                {calculation.allowance > 0 && (
                  <div className="receipt-row">
                    <span>Driver Allowance / Outstation Charge</span>
                    <span>₹{calculation.allowance.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="receipt-row receipt-row-bold">
                  <span>Total Payable Fare</span>
                  <span>₹{calculation.totalFare.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleConfirm}
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading || submitting}
          >
            {submitting ? 'Creating Booking...' : 'Confirm & Request Ride'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmBooking() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Loading confirmation screen...</div>}>
      <ConfirmBookingContent />
    </Suspense>
  );
}
