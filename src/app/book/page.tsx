'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Car, MapPin, Calendar, Clock, DollarSign, ArrowRight, HelpCircle, User } from 'lucide-react';

const TAMIL_NADU_CITIES = [
  'Chennai',
  'Coimbatore',
  'Madurai',
  'Trichy (Tiruchirappalli)',
  'Salem',
  'Tiruppur',
  'Erode',
  'Vellore',
  'Tirunelveli',
  'Thoothukudi (Tuticorin)',
  'Nagercoil',
  'Thanjavur',
  'Dindigul',
  'Karur',
  'Ooty (Udhagamandalam)',
  'Kanchipuram',
  'Karaikudi',
  'Kumbakonam',
  'Cuddalore',
  'Neyveli',
  'Tiruvannamalai',
  'Pollachi',
  'Pudukkottai',
  'Ambur',
  'Hosur',
  'Rajapalayam',
  'Sivakasi',
  'Nagapattinam',
  'Viluppuram',
  'Theni',
  'Namakkal',
  'Dharmapuri',
  'Krishnagiri',
  'Ramanathapuram',
  'Tiruvarur',
  'Ariyalur',
  'Perambalur',
  'Srivilliputhur',
  'Chidambaram',
  'Mayiladuthurai',
  'Kanyakumari',
  'Tenkasi',
  'Ranipet',
  'Tirupathur',
  'Kallakurichi',
  'Chengalpattu'
];



interface CustomDateTimePickerProps {
  label: string;
  valueDate: string;
  valueTime: string;
  onChange: (date: string, time: string) => void;
  minDate?: string;
}

function CustomDateTimePicker({ label, valueDate, valueTime, onChange, minDate }: CustomDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Helper to format date display
  const formatDisplayDateTime = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return 'Select Date & Time';
    const [year, month, day] = dateStr.split('-');
    const [hours, minutes] = timeStr.split(':');
    const hourNum = parseInt(hours, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = String(hourNum % 12 || 12).padStart(2, '0');
    return `${day}-${month}-${year} ${formattedHour}:${minutes} ${ampm}`;
  };

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Split selected valueDate & valueTime into local state for temporary changes
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed

  // For time
  const [selectedHour, setSelectedHour] = useState('12');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');

  useEffect(() => {
    if (valueDate) {
      const parts = valueDate.split('-');
      if (parts.length === 3) {
        setCurrentYear(parseInt(parts[0], 10));
        setCurrentMonth(parseInt(parts[1], 10) - 1);
      }
    }
    if (valueTime) {
      const [h, m] = valueTime.split(':');
      const hourNum = parseInt(h, 10);
      setSelectedPeriod(hourNum >= 12 ? 'PM' : 'AM');
      setSelectedHour(String(hourNum % 12 || 12).padStart(2, '0'));
      setSelectedMinute(m);
    }
  }, [valueDate, valueTime, isOpen]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleDaySelect = (dayNum: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const newDateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    
    // Auto convert local 12h time to 24h format for saving
    let hr24 = parseInt(selectedHour, 10);
    if (selectedPeriod === 'PM' && hr24 !== 12) hr24 += 12;
    if (selectedPeriod === 'AM' && hr24 === 12) hr24 = 0;
    const newTimeStr = `${String(hr24).padStart(2, '0')}:${selectedMinute}`;
    
    onChange(newDateStr, newTimeStr);
  };

  const handleTimeSelect = (type: 'hour' | 'minute' | 'period', val: string) => {
    let hr = selectedHour;
    let min = selectedMinute;
    let prd = selectedPeriod;

    if (type === 'hour') {
      hr = val;
      setSelectedHour(val);
    } else if (type === 'minute') {
      min = val;
      setSelectedMinute(val);
    } else if (type === 'period') {
      prd = val;
      setSelectedPeriod(val);
    }

    let hr24 = parseInt(hr, 10);
    if (prd === 'PM' && hr24 !== 12) hr24 += 12;
    if (prd === 'AM' && hr24 === 12) hr24 = 0;
    const newTimeStr = `${String(hr24).padStart(2, '0')}:${min}`;
    
    onChange(valueDate, newTimeStr);
  };

  // Render Days Grid
  const daysArray = [];
  // Add empty slots for firstDayIndex padding
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  // Hours array (01 - 12)
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  // Minutes array (00, 05, 10, 15, ..., 55)
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
  const periods = ['AM', 'PM'];

  const getIsActiveDay = (day: number | null) => {
    if (!day) return false;
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    return valueDate === `${currentYear}-${formattedMonth}-${formattedDay}`;
  };

  return (
    <div className="form-group" style={{ position: 'relative', marginBottom: '1.5rem' }} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          backgroundColor: 'white',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
          zIndex: 5
        }}
      >
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>
            {label}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '0.02em' }}>
            {formatDisplayDateTime(valueDate, valueTime)}
          </div>
        </div>
        <Calendar size={20} style={{ color: 'var(--text-muted)' }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '105%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '380px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Main content grid: Calendar on left, Time on right */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1rem' }}>
            
            {/* Calendar section */}
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <button type="button" onClick={handlePrevMonth} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>&larr;</button>
                <span style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '0.9rem' }}>
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <button type="button" onClick={handleNextMonth} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>&rarr;</button>
              </div>

              {/* Day Labels */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
              </div>

              {/* Days grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {daysArray.map((day, idx) => {
                  const isActive = getIsActiveDay(day);
                  return (
                    <div
                      key={idx}
                      onClick={() => day && handleDaySelect(day)}
                      style={{
                        padding: '6px 0',
                        textAlign: 'center',
                        fontSize: '0.8rem',
                        cursor: day ? 'pointer' : 'default',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                        color: isActive ? '#FFFFFF' : day ? 'var(--secondary)' : 'transparent',
                        fontWeight: isActive ? 700 : 500,
                        transition: 'background-color 0.2s',
                        border: '1px solid transparent'
                      }}
                      className={day ? "day-cell-hover" : ""}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.25rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem' }}>
              
              {/* Hours Column */}
              <div className="time-scroll-col" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '180px', gap: '2px', scrollbarWidth: 'none' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '4px' }}>HH</div>
                {hours.map(h => (
                  <div
                    key={h}
                    onClick={() => handleTimeSelect('hour', h)}
                    style={{
                      padding: '4px 0',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: selectedHour === h ? 'var(--secondary)' : 'transparent',
                      color: selectedHour === h ? '#FFFFFF' : 'var(--text-muted)',
                      fontWeight: selectedHour === h ? 700 : 500
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {/* Minutes Column */}
              <div className="time-scroll-col" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '180px', gap: '2px', scrollbarWidth: 'none' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '4px' }}>MM</div>
                {minutes.map(m => (
                  <div
                    key={m}
                    onClick={() => handleTimeSelect('minute', m)}
                    style={{
                      padding: '4px 0',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: selectedMinute === m ? 'var(--secondary)' : 'transparent',
                      color: selectedMinute === m ? '#FFFFFF' : 'var(--text-muted)',
                      fontWeight: selectedMinute === m ? 700 : 500
                    }}
                  >
                    {m}
                  </div>
                ))}
              </div>

              {/* Period Column */}
              <div className="time-scroll-col" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '180px', gap: '4px', scrollbarWidth: 'none', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '4px' }}>AM/PM</div>
                {periods.map(p => (
                  <div
                    key={p}
                    onClick={() => handleTimeSelect('period', p)}
                    style={{
                      padding: '8px 0',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: selectedPeriod === p ? 'var(--primary)' : 'transparent',
                      color: selectedPeriod === p ? '#FFFFFF' : 'var(--text-muted)',
                      fontWeight: selectedPeriod === p ? 700 : 500,
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {p}
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                onChange(`${year}-${month}-${day}`, `${hours}:${minutes}`);
              }}
              style={{
                fontSize: '0.75rem',
                color: 'var(--primary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Today (Now)
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: 'var(--secondary)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BookFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Helper to get initial current local date and time
  const getInitialDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`
    };
  };

  const initialDT = getInitialDateTime();

  // Helper to get initial return trip date and time (+1 day)
  const getInitialReturnDateTime = () => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`
    };
  };

  const initialReturnDT = getInitialReturnDateTime();

  const [carType, setCarType] = useState<'sedan' | 'suv' | 'innova'>('sedan');
  const [rideType, setRideType] = useState<'one_way' | 'round_trip'>('one_way');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [scheduledDate, setScheduledDate] = useState(initialDT.date);
  const [scheduledTime, setScheduledTime] = useState(initialDT.time);
  const [returnDate, setReturnDate] = useState(initialReturnDT.date);
  const [returnTime, setReturnTime] = useState(initialReturnDT.time);
  const [distanceKm, setDistanceKm] = useState<number>(50);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const contactDetailsRef = React.useRef<HTMLDivElement>(null);
  const fullNameRef = React.useRef<HTMLInputElement>(null);
  const phoneRef = React.useRef<HTMLInputElement>(null);

  // Autocomplete states
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<{description: string; place_id: string; main_text: string; secondary_text: string}[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<{description: string; place_id: string; main_text: string; secondary_text: string}[]>([]);

  // Date/Time input Ref
  const dateTimeRef = React.useRef<HTMLInputElement>(null);

  // Prefill from query params if coming from landing page estimator
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        checkUserProfile(user.id);
      }
    });

    const paramCar = searchParams.get('car_type');
    const paramRide = searchParams.get('ride_type');
    const paramDist = searchParams.get('distance');

    if (paramCar === 'sedan' || paramCar === 'suv' || paramCar === 'innova') {
      setCarType(paramCar as any);
    }
    if (paramRide === 'one_way' || paramRide === 'round_trip') {
      setRideType(paramRide);
    }
    if (paramDist) {
      setDistanceKm(Number(paramDist));
    }
  }, [searchParams]);

  // Debounced Google Places suggestions for Pickup
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (pickupAddress.trim().length >= 2) {
        fetchGooglePlaceSuggestions(pickupAddress, setPickupSuggestions);
      } else {
        setPickupSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [pickupAddress]);

  // Debounced Google Places suggestions for Drop
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (dropAddress.trim().length >= 2) {
        fetchGooglePlaceSuggestions(dropAddress, setDropSuggestions);
      } else {
        setDropSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [dropAddress]);

  const checkUserProfile = async (userId: string) => {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, full_name, phone')
      .eq('id', userId)
      .single();
    
    if (userProfile) {
      if (userProfile.role !== 'customer') {
        router.push('/');
      } else {
        setProfile(userProfile);
      }
    }
  };

  const fetchGooglePlaceSuggestions = async (
    query: string,
    setSuggestions: (s: {description: string; place_id: string; main_text: string; secondary_text: string}[]) => void
  ) => {
    try {
      const res = await fetch(`/api/places?input=${encodeURIComponent(query)}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`API request failed: ${res.status} - ${errorData.error || ''} (${errorData.status || ''})`);
      }
      const data = await res.json();
      if (data.predictions) {
        setSuggestions(data.predictions);
      }
    } catch (err) {
      console.warn('Google Places API failed, falling back to local districts:', err);
      // Fallback: search local districts
      const matches = TAMIL_NADU_CITIES
        .filter(city => city.toLowerCase().includes(query.toLowerCase()))
        .map(city => ({ description: city, place_id: '', main_text: city, secondary_text: 'Tamil Nadu, India' }));
      setSuggestions(matches);
    }
  };

  const formatDisplayDateTime = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return '';
    const [year, month, day] = dateStr.split('-');
    const [hours, minutes] = timeStr.split(':');
    
    const hourNum = parseInt(hours, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = String(hourNum % 12 || 12).padStart(2, '0');
    
    return `${day}-${month}-${year} ${formattedHour}:${minutes} ${ampm}`;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // If guest, validate name and phone
    if (!user) {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setErrorMsg('Please enter your full name (at least 2 characters).');
        contactDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => fullNameRef.current?.focus(), 500);
        return;
      }
      const digits = phone.replace(/\D/g, '');
      if (digits.length !== 10) {
        setErrorMsg('Please enter a valid 10-digit phone number.');
        contactDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => phoneRef.current?.focus(), 500);
        return;
      }
    }

    if (!pickupAddress.trim() || !dropAddress.trim() || !scheduledDate || !scheduledTime) {
      setErrorMsg('Please fill in all details.');
      return;
    }

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    let returnScheduledAt: string | null = null;
    if (rideType === 'round_trip') {
      if (!returnDate || !returnTime) {
        setErrorMsg('Please select a return trip date and time.');
        return;
      }
      const pickupTimeMs = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
      const returnTimeMs = new Date(`${returnDate}T${returnTime}`).getTime();
      if (returnTimeMs <= pickupTimeMs) {
        setErrorMsg('Return trip date/time must be after pickup date/time.');
        return;
      }
      returnScheduledAt = new Date(`${returnDate}T${returnTime}`).toISOString();
    }

    // Query parameters passing to confirmation screen
    const queryParams: any = {
      car_type: carType,
      ride_type: rideType,
      pickup_address: pickupAddress,
      drop_address: dropAddress,
      scheduled_at: scheduledAt,
      distance_km: distanceKm.toString(),
      payment_mode: paymentMode,
    };

    if (returnScheduledAt) {
      queryParams.return_scheduled_at = returnScheduledAt;
    }

    if (!user) {
      queryParams.full_name = fullName.trim();
      queryParams.phone = phone.trim();
    }

    const query = new URLSearchParams(queryParams).toString();
    router.push(`/book/confirm?${query}`);
  };

  return (
    <div className="page-entry-transition" style={{ padding: '3rem 0', backgroundColor: 'var(--bg-color)', minHeight: '80vh' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .city-suggestion-item {
          transition: background-color 0.2s, color 0.2s;
        }
        .city-suggestion-item:hover {
          background-color: rgba(249, 115, 22, 0.08) !important;
          color: var(--primary) !important;
        }
        .day-cell-hover {
          transition: background-color 0.2s, color 0.2s;
        }
        .day-cell-hover:hover {
          background-color: rgba(249, 115, 22, 0.1) !important;
          color: var(--primary) !important;
        }
        .time-scroll-col::-webkit-scrollbar {
          display: none;
        }
      `}} />
      <div className="container" style={{ maxWidth: '750px' }}>
        
        {/* Step Indicator */}
        <div className="steps-container">
          <div className="steps-line-wrapper">
            <div className="steps-progress" style={{ width: '0%' }}></div>
          </div>
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

        <div className="card shimmer-sweep-effect">
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--secondary)', textAlign: 'left' }}>
            Book Your Taxi
          </h2>

          {errorMsg && (
            <div className="alert alert-danger" style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {user && profile && (
            <div style={{
              backgroundColor: 'rgba(34, 197, 94, 0.05)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.9rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Logged in as:</span>{' '}
                <strong style={{ color: 'var(--secondary)' }}>{profile.full_name}</strong>{' '}
                <span style={{ color: 'var(--text-muted)' }}>({profile.phone})</span>
              </div>
              <span style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                color: 'var(--success)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                Account Verified
              </span>
            </div>
          )}

          {!user && (
            <div ref={contactDetailsRef} style={{
              backgroundColor: 'rgba(249, 115, 22, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} style={{ color: 'var(--primary)' }} /> Contact Details
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Enter your contact info so the office coordinator can call you to confirm your ride.
              </p>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    ref={fullNameRef}
                    type="text"
                    className="form-control"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!user}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div style={{ display: 'flex' }}>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.375rem 0.75rem',
                      backgroundColor: 'rgba(30, 41, 59, 0.05)',
                      border: '1px solid var(--border-color)',
                      borderRight: 'none',
                      borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem'
                    }}>+91</span>
                    <input
                      ref={phoneRef}
                      type="tel"
                      className="form-control"
                      style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}
                      placeholder="99999 99999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required={!user}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleNext}>
            
            {/* Car Selection */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Select Vehicle</label>
              <div className="vehicle-selector-grid">
                {(['sedan', 'suv', 'innova'] as const).map(type => {
                  const isActive = carType === type;
                  const details = {
                    sedan: {
                      name: 'SEDAN',
                      passengers: '4 Passengers',
                      basePrice: 15, // Display default With A/C rates as show in the image
                      tag: 'Most Booked',
                      img: '/assets/sedan car.png'
                    },
                    suv: {
                      name: 'SUV',
                      passengers: '6 Passengers',
                      basePrice: 20,
                      tag: 'Extra Space',
                      img: '/assets/SUV car.png'
                    },
                    innova: {
                      name: 'INNOVA',
                      passengers: '7 Passengers',
                      basePrice: 21,
                      tag: 'Executive',
                      img: '/assets/Innova car.png'
                    }
                  }[type];

                  return (
                    <button
                      key={type}
                      type="button"
                      className={`vehicle-card-button ${isActive ? 'active' : ''}`}
                      onClick={() => setCarType(type)}
                    >
                      <div className="vehicle-card-inner">
                        <span className="vehicle-tag">
                          {isActive ? '✓ Selected' : details.tag}
                        </span>
                        <div className="vehicle-img-wrapper">
                          <img src={details.img} alt={details.name} className={`vehicle-img ${type}-img`} />
                        </div>
                        <div>
                          <div className="vehicle-name">{details.name}</div>
                          <div className="vehicle-passengers">{details.passengers}</div>
                        </div>
                        <div className="vehicle-price">
                          ₹{details.basePrice}
                          <span className="vehicle-price-unit">/km</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ride Type selection */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Ride Type</label>
              <div className="ridetype-grid">
                <button
                  type="button"
                  className={`ridetype-button ${rideType === 'one_way' ? 'active' : ''}`}
                  onClick={() => setRideType('one_way')}
                >
                  <span className="ridetype-title">One Way</span>
                  <span className="ridetype-subtitle">130 KM Minimum Billing</span>
                </button>
                <button
                  type="button"
                  className={`ridetype-button ${rideType === 'round_trip' ? 'active' : ''}`}
                  onClick={() => setRideType('round_trip')}
                >
                  <span className="ridetype-title">Round Trip</span>
                  <span className="ridetype-subtitle">250 KM / Day Minimum</span>
                </button>
              </div>
            </div>

            {/* Addresses */}
            <div className="form-grid" style={{ position: 'relative' }}>
              
              {/* Pickup Address Autocomplete */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} style={{ color: 'var(--primary)' }} /> Pickup Address
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter pickup location"
                  value={pickupAddress}
                  onChange={(e) => {
                    setPickupAddress(e.target.value);
                    setShowPickupSuggestions(true);
                  }}
                  onFocus={() => setShowPickupSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowPickupSuggestions(false), 200);
                  }}
                  required
                />
                {showPickupSuggestions && pickupSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 10,
                    maxHeight: '260px',
                    overflowY: 'auto',
                    marginTop: '0.25rem'
                  }}>
                    {pickupSuggestions.map((place, idx) => (
                      <div
                        key={place.place_id || idx}
                        onClick={() => {
                          setPickupAddress(place.description);
                          setShowPickupSuggestions(false);
                        }}
                        style={{
                          padding: '0.7rem 1rem',
                          cursor: 'pointer',
                          borderBottom: idx === pickupSuggestions.length - 1 ? 'none' : '1px solid var(--border-color)',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.6rem',
                          textAlign: 'left'
                        }}
                        className="city-suggestion-item"
                      >
                        <MapPin size={16} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '0.9rem' }}>{place.main_text}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1px' }}>{place.secondary_text}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{
                      padding: '0.4rem 1rem',
                      textAlign: 'right',
                      borderTop: '1px solid var(--border-color)',
                      backgroundColor: '#FAFAFA'
                    }}>
                      <img src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3_hdpi.png" alt="Powered by Google" style={{ height: '14px', opacity: 0.7 }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Drop Address Autocomplete */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} style={{ color: 'var(--primary)' }} /> Drop Address
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter drop location"
                  value={dropAddress}
                  onChange={(e) => {
                    setDropAddress(e.target.value);
                    setShowDropSuggestions(true);
                  }}
                  onFocus={() => setShowDropSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowDropSuggestions(false), 200);
                  }}
                  required
                />
                {showDropSuggestions && dropSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 10,
                    maxHeight: '260px',
                    overflowY: 'auto',
                    marginTop: '0.25rem'
                  }}>
                    {dropSuggestions.map((place, idx) => (
                      <div
                        key={place.place_id || idx}
                        onClick={() => {
                          setDropAddress(place.description);
                          setShowDropSuggestions(false);
                        }}
                        style={{
                          padding: '0.7rem 1rem',
                          cursor: 'pointer',
                          borderBottom: idx === dropSuggestions.length - 1 ? 'none' : '1px solid var(--border-color)',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.6rem',
                          textAlign: 'left'
                        }}
                        className="city-suggestion-item"
                      >
                        <MapPin size={16} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '0.9rem' }}>{place.main_text}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1px' }}>{place.secondary_text}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{
                      padding: '0.4rem 1rem',
                      textAlign: 'right',
                      borderTop: '1px solid var(--border-color)',
                      backgroundColor: '#FAFAFA'
                    }}>
                      <img src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3_hdpi.png" alt="Powered by Google" style={{ height: '14px', opacity: 0.7 }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Combined Date & Time Field */}
            <CustomDateTimePicker
              label="Pickup Date & Time"
              valueDate={scheduledDate}
              valueTime={scheduledTime}
              onChange={(date, time) => {
                setScheduledDate(date);
                setScheduledTime(time);
              }}
            />

            {/* Return Date & Time Field (for Round Trips) */}
            {rideType === 'round_trip' && (
              <CustomDateTimePicker
                label="Return Date & Time"
                valueDate={returnDate}
                valueTime={returnTime}
                onChange={(date, time) => {
                  setReturnDate(date);
                  setReturnTime(time);
                }}
              />
            )}

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
                  <option value="cash">Cash</option>
                  <option value="upi">UPI (GPay / PhonePe)</option>
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
