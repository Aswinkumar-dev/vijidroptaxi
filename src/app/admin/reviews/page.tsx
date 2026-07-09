'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Star, MessageSquare, ShieldAlert } from 'lucide-react';

export default function AdminReviews() {
  const router = useRouter();

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // Authenticate & Verify admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        router.push('/');
        return;
      }

      // Fetch reviews
      const { data: reviewsData, error: reviewsErr } = await supabase
        .from('reviews')
        .select(`
          *,
          customer:profiles!reviews_customer_id_fkey(id, full_name, phone),
          driver:drivers(
            id,
            profile:profiles(id, full_name)
          ),
          ride:rides(id, pickup_address, drop_address, scheduled_at)
        `)
        .order('created_at', { ascending: false });

      if (reviewsErr) throw reviewsErr;
      setReviews(reviewsData || []);

    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred fetching reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete/moderate this review?')) return;
    
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      fetchReviews();
      alert('Review moderated/removed successfully.');
    } catch (err: any) {
      alert(err.message || 'Error deleting review.');
    }
  };

  return (
    <div style={{ padding: '3rem 0', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
      <div className="container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: 'var(--secondary)' }}>Reviews & Feedback Moderation</h1>
            <p>Monitor ratings and passenger comments submitted for drivers and trips</p>
          </div>
          <button onClick={fetchReviews} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={16} /> Refresh Reviews
          </button>
        </div>

        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem' }}>
            <div style={{ color: 'var(--text-muted)' }}>Loading reviews records...</div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
            <p>No customer reviews submitted yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {reviews.map(review => (
              <div key={review.id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.25rem', color: 'var(--accent)' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} style={{ fill: i < review.rating ? 'var(--accent)' : 'none', stroke: 'var(--accent)' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                      Billed: {new Date(review.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="btn btn-danger btn-sm"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                  >
                    Moderate/Delete
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1rem' }} className="grid-2">
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Details</span>
                    <div style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                      Passenger: {review.customer?.full_name} ({review.customer?.phone})
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      Driver: {review.driver?.profile?.full_name || 'Driver details not found'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ride Information</span>
                    {review.ride ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>
                        <div><strong>From:</strong> {review.ride.pickup_address}</div>
                        <div><strong>To:</strong> {review.ride.drop_address}</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ride deleted</span>
                    )}
                  </div>
                </div>

                {review.comment && (
                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <MessageSquare size={16} style={{ color: 'var(--primary)', marginTop: '0.2rem' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Review Comment:</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: 500, marginTop: '0.15rem' }}>"{review.comment}"</div>
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
