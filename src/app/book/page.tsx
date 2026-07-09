'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Car, MapPin, Calendar, Clock, DollarSign, ArrowRight, HelpCircle } from 'lucide-react';

function BookFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [carType, setCarType] = useState<'hatchback' | 'sedan' | 'suv'>('sedan');
  const [rideType, setRideType] = useState<'one_way' | 'round_trip'>('one_way');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [distanceKm, setDistanceKm] = useState<number>(50);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card_manual'>('cash');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [user, setUser] = useState<any>(null);

  // Prefill from query params if coming from landing page estimator
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login?msg=Please log in to book a ride');
      } else {
        setUser(user);
        checkUserProfile(user.id);
      }
    });

    const paramCar = searchParams.get('car_type');
    const paramRide = searchParams.get('ride_type');
    const paramDist = searchParams.get('distance');

    if (paramCar === 'hatchback' || paramCar === 'sedan' || paramCar === 'suv') {
      setCarType(paramCar);
    }
    if (paramRide === 'one_way' || paramRide === 'round_trip') {
      setRideType(paramRide);
    }
    if (paramDist) {
      setDistanceKm(Number(paramDist));
    }
  }, [searchParams]);

  const checkUserProfile = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (profile && profile.role !== 'customer') {
      router.push('/');
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pickupAddress.trim() || !dropAddress.trim() || !scheduledDate || !scheduledTime) {
      setErrorMsg('Please fill in all details.');
      return;
    }

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    // Query parameters passing to confirmation screen
    const query = new URLSearchParams({
      car_type: carType,
      ride_type: rideType,
      pickup_address: pickupAddress,
      drop_address: dropAddress,
      scheduled_at: scheduledAt,
      distance_km: distanceKm.toString(),
      payment_mode: paymentMode,
    }).toString();

    router.push(`/book/confirm?${query}`);
  };

  return (
    <div style={{ padding: '3rem 0', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '750px' }}>
        
        {/* Step Indicator */}
        <div className="steps-container">
          <div className="steps-progress" style={{ width: '0%' }}></div>
          <div className="step-node active">
            <div className="step-circle">1</div>
            <span className="step-label">Ride Details</span>
          </div>
          <div className="step-node">
            <div className="step-circle">2</div>
            <span className="step-label">Confirmation</span>
          </div>
          <div className="step-node">
            <div className="step-circle">3</div>
            <span className="step-label">Status</span>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--secondary)' }}>
            <Car style={{ color: 'var(--primary)' }} /> Book Your Taxi
          </h2>

          {errorMsg && (
            <div className="alert alert-danger">
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleNext}>
            
            {/* Car Selection */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Car Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {(['hatchback', 'sedan', 'suv'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`btn ${carType === type ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ border: carType !== type ? '1px solid var(--border-color)' : '', textTransform: 'capitalize' }}
                    onClick={() => setCarType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Ride Type selection */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Ride Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  className={`btn ${rideType === 'one_way' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ border: rideType !== 'one_way' ? '1px solid var(--border-color)' : '' }}
                  onClick={() => setRideType('one_way')}
                >
                  One-Way Outstation Drop
                </button>
                <button
                  type="button"
                  className={`btn ${rideType === 'round_trip' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ border: rideType !== 'round_trip' ? '1px solid var(--border-color)' : '' }}
                  onClick={() => setRideType('round_trip')}
                >
                  Round Trip Outstation
                </button>
              </div>
            </div>

            {/* Addresses */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} style={{ color: 'var(--primary)' }} /> Pickup Address
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="E.g. Gandhipuram, Coimbatore"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} style={{ color: 'var(--primary)' }} /> Drop Address
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="E.g. Central Station, Chennai"
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} style={{ color: 'var(--primary)' }} /> Pickup Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={14} style={{ color: 'var(--primary)' }} /> Pickup Time
                </label>
                <input
                  type="time"
                  className="form-control"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Estimated distance & payment mode */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Estimated Distance (KM)</label>
                <input
                  type="number"
                  className="form-control"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Math.max(1, Number(e.target.value)))}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <DollarSign size={14} style={{ color: 'var(--primary)' }} /> Payment Mode
                </label>
                <select
                  className="form-control"
                  value={paymentMode}
                  onChange={(e: any) => setPaymentMode(e.target.value)}
                >
                  <option value="cash">Cash to Driver</option>
                  <option value="upi">UPI (GPay / PhonePe)</option>
                  <option value="card_manual">Card (Manual Collection)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1.5rem' }}>
              Confirm Fare Estimate <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Book() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Loading booking form...</div>}>
      <BookFormContent />
    </Suspense>
  );
}
