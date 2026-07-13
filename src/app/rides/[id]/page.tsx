'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, User, Phone, MapPin, Calendar, Clock, Car, Star, DollarSign, ArrowLeft, RefreshCw, StarIcon } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RideStatusDetail({ params }: PageProps) {
  const { id: rideId } = use(params);
  const router = useRouter();

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [hasCheckedReview, setHasCheckedReview] = useState(false);

  const fetchRideDetails = async () => {
    try {
      const response = await fetch(`/api/rides/${rideId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch ride details');
      }

      setRide(data);
      
      // Auto-trigger review check if completed
      if (data.status === 'completed' && !hasCheckedReview) {
        checkExistingReview();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingReview = async () => {
    try {
      setHasCheckedReview(true);
      // Query review in DB
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('ride_id', rideId)
        .maybeSingle();

      if (!error && !data) {
        // No review exists yet, automatically open review modal
        setShowReviewModal(true);
      } else if (data) {
        setReviewSubmitted(true);
      }
    } catch (err) {
      console.error('Error checking review:', err);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        fetchRideDetails();
      }
    });

    // 1. Supabase Realtime Subscription
    const channel = supabase
      .channel(`ride-status-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`,
        },
        () => {
          fetchRideDetails();
        }
      )
      .subscribe();

    // 2. Polling Fallback (Interval 7s)
    const pollInterval = setInterval(() => {
      fetchRideDetails();
    }, 7000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [rideId, hasCheckedReview]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);

    try {
      const res = await fetch(`/api/rides/${rideId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setReviewSubmitted(true);
      setShowReviewModal(false);
      alert('Thank you for your feedback!');
    } catch (err: any) {
      alert(err.message || 'Error submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
        <RefreshCw className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem auto' }} size={32} />
        <div style={{ color: 'var(--text-muted)' }}>Loading ride details...</div>
      </div>
    );
  }

  if (errorMsg || !ride) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ color: 'var(--error)', marginBottom: '1rem' }}>Access Error</h2>
          <p style={{ marginBottom: '2rem' }}>{errorMsg || 'Ride details could not be loaded.'}</p>
          <Link href="/rides" className="btn btn-primary">
            Back to My Rides
          </Link>
        </div>
      </div>
    );
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Booking received, finding a driver...';
      case 'confirmed':
        return 'Driver assigned, arriving soon!';
      case 'driver_arrived':
        return 'Driver has arrived at your location!';
      case 'ongoing':
        return 'Ride started. In progress...';
      case 'completed':
        return 'Ride completed! Thank you for traveling with us.';
      case 'cancelled':
        return 'This booking was cancelled.';
      default:
        return status;
    }
  };

  const getStepProgress = (status: string) => {
    switch (status) {
      case 'pending': return '0%';
      case 'confirmed': return '25%';
      case 'driver_arrived': return '50%';
      case 'ongoing': return '75%';
      case 'completed': return '100%';
      default: return '0%';
    }
  };

  return (
    <div style={{ padding: '3rem 0', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '750px' }}>
        
        <button onClick={() => router.push('/rides')} className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <ArrowLeft size={16} /> All My Rides
        </button>

        {/* Live Status Header Card */}
        <div className="card" style={{ marginBottom: '2rem', borderTop: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Live Ride Status
              </span>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>
                {getStatusText(ride.status)}
              </h2>
            </div>
            <span className={`badge badge-${ride.status}`}>
              {ride.status.replace('_', ' ')}
            </span>
          </div>

          <div className="steps-container" style={{ margin: '1rem 0 2.5rem 0' }}>
            <div className="steps-line-wrapper">
              <div className="steps-progress" style={{ width: getStepProgress(ride.status) }}></div>
            </div>
            <div className={`step-node ${['pending', 'confirmed', 'driver_arrived', 'ongoing', 'completed'].includes(ride.status) ? 'completed' : ''}`}>
              <div className="step-circle">1</div>
              <span className="step-label" style={{ fontSize: '0.65rem' }}>Pending</span>
            </div>
            <div className={`step-node ${['confirmed', 'driver_arrived', 'ongoing', 'completed'].includes(ride.status) ? 'completed' : ride.status === 'pending' ? 'active' : ''}`}>
              <div className="step-circle">2</div>
              <span className="step-label" style={{ fontSize: '0.65rem' }}>Assigned</span>
            </div>
            <div className={`step-node ${['driver_arrived', 'ongoing', 'completed'].includes(ride.status) ? 'completed' : ride.status === 'confirmed' ? 'active' : ''}`}>
              <div className="step-circle">3</div>
              <span className="step-label" style={{ fontSize: '0.65rem' }}>Arrived</span>
            </div>
            <div className={`step-node ${['ongoing', 'completed'].includes(ride.status) ? 'completed' : ride.status === 'driver_arrived' ? 'active' : ''}`}>
              <div className="step-circle">4</div>
              <span className="step-label" style={{ fontSize: '0.65rem' }}>Ongoing</span>
            </div>
            <div className={`step-node ${ride.status === 'completed' ? 'completed' : ride.status === 'ongoing' ? 'active' : ''}`}>
              <div className="step-circle">5</div>
              <span className="step-label" style={{ fontSize: '0.65rem' }}>Finished</span>
            </div>
          </div>

          {/* Pending Status Alert and Office Coordination Call */}
          {ride.status === 'pending' && (
            <div style={{
              backgroundColor: 'rgba(249, 115, 22, 0.05)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              marginTop: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes pulse {
                  0% {
                    transform: scale(0.95);
                    box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7);
                  }
                  70% {
                    transform: scale(1);
                    box-shadow: 0 0 0 8px rgba(249, 115, 22, 0);
                  }
                  100% {
                    transform: scale(0.95);
                    box-shadow: 0 0 0 0 rgba(249, 115, 22, 0);
                  }
                }
              `}} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  animation: 'pulse 1.5s infinite'
                }}></div>
                <strong style={{ color: 'var(--secondary)', fontSize: '1rem' }}>
                  Awaiting Dispatcher Confirmation
                </strong>
              </div>
              
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                Booking Received! We are confirming your ride shortly. Our coordinator will call you within 5 minutes to confirm driver availability.
              </p>

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                marginTop: '0.5rem',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1rem'
              }}>
                <a href="tel:+916382882740" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                  <Phone size={16} /> Call Coordinator 1
                </a>
                <a href="tel:+916384819045" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                  <Phone size={16} /> Call Coordinator 2
                </a>
              </div>
            </div>
          )}

          {/* OTP Presentation: ONLY shown once status becomes driver_arrived */}
          {ride.status === 'driver_arrived' && ride.otp && (
            <div className="otp-display-box">
              <div style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '1rem' }}>
                Share this OTP with your driver to start the ride:
              </div>
              <div className="otp-number">{ride.otp}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Do not share this code before the driver arrives.
              </div>
            </div>
          )}

          {/* If completed, show invoice details */}
          {ride.status === 'completed' && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Link href={`/rides/${rideId}/invoice`} className="btn btn-primary" style={{ flex: 1 }}>
                View Invoice Receipt
              </Link>
              {!reviewSubmitted && (
                <button onClick={() => setShowReviewModal(true)} className="btn btn-outline" style={{ flex: 1 }}>
                  Submit Ride Review
                </button>
              )}
            </div>
          )}
        </div>

        {/* Assigned Driver & Car Details (Only once status is confirmed, driver_arrived, ongoing, completed) */}
        {['confirmed', 'driver_arrived', 'ongoing', 'completed'].includes(ride.status) && ride.driver && (
          <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* Driver Info */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} style={{ color: 'var(--primary)' }} /> Assigned Driver
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '1.1rem' }}>
                  {ride.driver.profile?.full_name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                  <a href={`tel:${ride.driver.profile?.phone}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    {ride.driver.profile?.phone}
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <Star size={14} style={{ fill: 'var(--accent)', stroke: 'var(--accent)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ride.driver.rating_avg} Rating</span>
                </div>
              </div>
            </div>

            {/* Car Info */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Car size={18} style={{ color: 'var(--primary)' }} /> Vehicle Fleet Details
              </h3>
              {ride.car ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '1.1rem' }}>
                    {ride.car.color} {ride.car.brand} {ride.car.model}
                  </div>
                  <div style={{
                    backgroundColor: 'var(--secondary)',
                    color: 'white',
                    padding: '0.4rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    width: 'fit-content',
                    marginTop: '0.25rem',
                    letterSpacing: '0.05em'
                  }}>
                    {ride.car.registration_number}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Class: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{ride.car.car_type}</span>
                  </div>
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>No car linked.</span>
              )}
            </div>

          </div>
        )}

        {/* Ride Details (Pickup/Drop/etc.) */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
            Trip Route & Cost Details
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <MapPin size={18} style={{ color: 'var(--primary)', marginTop: '0.25rem' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pickup Location</div>
                <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>{ride.pickup_address}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <MapPin size={18} style={{ color: 'var(--success)', marginTop: '0.25rem' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Drop Location</div>
                <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>{ride.drop_address}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} style={{ color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Scheduled On</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)' }}>
                    {new Date(ride.scheduled_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} style={{ color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Scheduled Time</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)' }}>
                    {new Date(ride.scheduled_at).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Distance</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--secondary)' }}>{ride.distance_km} KM</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ride Booking Fare</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>₹{ride.total_fare}</div>
              </div>
            </div>

            {ride.cancelled_reason && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                color: 'var(--error)',
                fontSize: '0.9rem',
                marginTop: '0.5rem'
              }}>
                <strong>Cancellation Reason:</strong> {ride.cancelled_reason}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Review Modal Dialog */}
      {showReviewModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--secondary)' }}>Rate Your Travel Experience</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Your feedback helps maintain fleet standards</p>
            </div>

            <form onSubmit={handleReviewSubmit}>
              <div className="stars-container">
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <button
                    key={starValue}
                    type="button"
                    className="star-btn"
                    onClick={() => setRating(starValue)}
                  >
                    <StarIcon
                      className={`star-icon ${rating >= starValue ? 'active' : ''}`}
                    />
                  </button>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Review Comment (Optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Share details about driver punctuality, vehicle cleanliness..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1, border: '1px solid var(--border-color)' }}
                  onClick={() => setShowReviewModal(false)}
                >
                  Skip Review
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
