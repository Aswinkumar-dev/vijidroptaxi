'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Star, CheckCircle, Car, MessageSquare } from 'lucide-react';

interface PageProps {
  params: Promise<{ driverId: string }>;
}

export default function SubmitDriverReviewPage({ params }: PageProps) {
  const { driverId } = use(params);

  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Form states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchDriverDetails = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await fetch(`/api/reviews/driver-details?driver_id=${driverId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch driver information.');
      }

      setDriver(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverDetails();
  }, [driverId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMsg('Please select a rating of at least 1 star.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driver_id: driverId,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', backgroundColor: 'var(--bg-color)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Loading driver details...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '3rem 1.5rem', backgroundColor: 'var(--bg-color)' }}>
        <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '3rem 2.5rem', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle size={44} style={{ color: 'var(--success)' }} />
          </div>
          <h2 style={{ color: 'var(--secondary)', marginBottom: '0.75rem' }}>Thank You!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.5 }}>
            Your rating and feedback have been registered successfully. We appreciate you taking the time to review your driver, {driver?.driver_name || 'your driver'}.
          </p>
          <Link href="/" className="btn btn-primary" style={{ width: '100%' }}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '90vh', padding: '3rem 1.5rem', backgroundColor: 'var(--bg-color)' }}>
      <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2.5rem 2rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>Rate Your Driver</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Help us maintain high quality drop taxi services by rating your driver.
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Driver Summary Box */}
        {driver && (
          <div style={{ backgroundColor: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', border: '1px solid var(--border-color)', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>
              <Car size={16} style={{ color: 'var(--primary)' }} />
              <span>Driver: {driver.driver_name}</span>
            </div>
            {driver.car_details && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', paddingLeft: '1.25rem' }}>
                Vehicle: {driver.car_details}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Star Rating Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
            <label className="form-label" style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Select Rating</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isActive = (hoverRating || rating) >= starVal;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      outline: 'none',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.85)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Star
                      size={36}
                      style={{
                        fill: isActive ? 'var(--primary)' : 'none',
                        stroke: isActive ? 'var(--primary)' : 'var(--text-muted)',
                        strokeWidth: isActive ? 1.5 : 1.25,
                        transition: 'color 0.15s ease, fill 0.15s ease',
                      }}
                    />
                  </button>
                );
              })}
            </div>
            {rating > 0 && (
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.75rem' }}>
                {rating === 1 && 'Terrible'}
                {rating === 2 && 'Bad'}
                {rating === 3 && 'Okay'}
                {rating === 4 && 'Good'}
                {rating === 5 && 'Excellent!'}
              </span>
            )}
          </div>

          {/* Comment Text Area */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
              <MessageSquare size={15} style={{ color: 'var(--primary)' }} /> Write a Review (Optional)
            </label>
            <textarea
              className="form-control"
              placeholder="Tell us about your trip experience, driving comfort, vehicle cleanliness, etc."
              rows={4}
              style={{ resize: 'none', fontSize: '0.9rem', padding: '0.75rem' }}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={submitting || rating === 0}
          >
            {submitting ? 'Submitting Review...' : 'Submit Feedback'}
          </button>
        </form>

      </div>
    </div>
  );
}
