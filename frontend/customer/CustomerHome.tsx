import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';
import { RiderMap } from '../src/components/maps/RiderMap';
import { SosModal } from '../src/components/SosModal';
import {
  MapPin,
  Navigation,
  Clock,
  Tag,
  CreditCard,
  Banknote,
  Shield,
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle2,
  Calendar,
  Briefcase,
  AlertCircle,
  Cpu,
  Zap,
  Activity
} from 'lucide-react';

const POPULAR_LOCATIONS = [
  { name: 'Indira Gandhi International Airport (T3), New Delhi', lat: 28.5562, lng: 77.1000 },
  { name: 'Connaught Place Central Market, New Delhi', lat: 28.6328, lng: 77.2197 },
  { name: 'Cyber City DLF Phase 2, Gurugram', lat: 28.4900, lng: 77.0890 },
  { name: 'Noida City Centre Metro, Sector 39, Noida', lat: 28.5747, lng: 77.3560 },
  { name: 'Kempegowda International Airport, Bengaluru', lat: 13.1986, lng: 77.7066 },
  { name: 'Indiranagar 100ft Road, Bengaluru', lat: 12.9784, lng: 77.6408 },
  { name: 'Chhatrapati Shivaji Maharaj Terminus, Mumbai', lat: 18.9402, lng: 72.8356 }
];

export const CustomerHome: React.FC = () => {
  const { user, token, t, openLoginModal } = useAuth();
  const navigate = useNavigate();

  const [pickup, setPickup] = useState(POPULAR_LOCATIONS[1].name);
  const [pickupCoord, setPickupCoord] = useState({ lat: POPULAR_LOCATIONS[1].lat, lng: POPULAR_LOCATIONS[1].lng });
  const [drop, setDrop] = useState(POPULAR_LOCATIONS[2].name);
  const [dropCoord, setDropCoord] = useState({ lat: POPULAR_LOCATIONS[2].lat, lng: POPULAR_LOCATIONS[2].lng });

  const [selectedCategory, setSelectedCategory] = useState<'BIKE' | 'AUTO' | 'MINI' | 'SEDAN' | 'SUV'>('AUTO');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE'>('CASH');
  const [promoCode, setPromoCode] = useState('WELCOME50');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');

  const [estimates, setEstimates] = useState<any[]>([]);
  const [distanceKm, setDistanceKm] = useState(16.4);
  const [durationMinutes, setDurationMinutes] = useState(38);
  const [loadingEstimates, setLoadingEstimates] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [showSos, setShowSos] = useState(false);

  const fetchEstimates = async () => {
    setLoadingEstimates(true);
    try {
      const res = await fetch('/api/fare/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLat: pickupCoord.lat,
          pickupLng: pickupCoord.lng,
          dropLat: dropCoord.lat,
          dropLng: dropCoord.lng,
          promoCode: appliedPromo ? appliedPromo.code : promoCode
        })
      });
      const data = await res.json();
      if (data.success) {
        setEstimates(data.estimates);
        setDistanceKm(data.distanceKm);
        setDurationMinutes(data.durationMinutes);
      }
    } catch (err) {
      console.warn('Fare estimate error:', err);
    } finally {
      setLoadingEstimates(false);
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, [pickupCoord, dropCoord, appliedPromo]);

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setPromoError('');
    try {
      const res = await fetch('/api/fare/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, amount: 200 })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedPromo(data.promo);
      } else {
        setPromoError(data.message || 'Invalid promo code');
      }
    } catch (e) {
      setPromoError('Error verifying promo code');
    }
  };

  const handleBookRide = async () => {
    if (!token) {
      openLoginModal('CUSTOMER');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const res = await fetch('/api/customer/rides/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleCategory: selectedCategory,
          pickupAddress: pickup,
          pickupLat: pickupCoord.lat,
          pickupLng: pickupCoord.lng,
          dropAddress: drop,
          dropLat: dropCoord.lat,
          dropLng: dropCoord.lng,
          paymentMethod,
          promoCode: appliedPromo?.code
        })
      });

      const data = await res.json();
      if (data.success && data.ride) {
        navigate(`/rider/ride/${data.ride.id}`);
      } else {
        setBookingError(data.message || 'Could not complete ride booking.');
      }
    } catch (err: any) {
      setBookingError(err.message || 'Network error requesting ride.');
    } finally {
      setBookingLoading(false);
    }
  };

  const currentCategoryEstimate = estimates.find((e) => e.category === selectedCategory);

  return (
    <div className="min-h-screen cyber-circuit-bg text-gray-100">
      {/* Top AI Circuit Ticker */}
      <div className="bg-[#0c0c10]/90 border-b border-yellow-500/20 py-2 px-4 text-xs font-semibold text-center flex items-center justify-center gap-2 backdrop-blur-md">
        <Cpu className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
        <span className="text-gray-300">
          Neural Dispatch Activated • Flat 50% OFF with code <strong className="text-yellow-400 font-mono">WELCOME50</strong> • 24/7 National SOS 112
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Black & Yellow Cyber Booking Card */}
          <div className="lg:col-span-5 bg-[#0e0e13]/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-yellow-500/20 space-y-6">
            {/* Service Tabs */}
            <div className="flex border-b border-yellow-500/20 pb-2 gap-6">
              <button className="flex items-center gap-2 font-black text-sm text-yellow-400 border-b-2 border-yellow-400 pb-2 -mb-2 shadow-neon-yellow-sm">
                <span>🚗</span> {t('ride')}
              </button>
              <button
                onClick={() => alert('Package delivery active in Delhi NCR & Bengaluru!')}
                className="flex items-center gap-2 font-semibold text-xs text-gray-400 hover:text-white pb-2"
              >
                <span>📦</span> Package
              </button>
              <button
                onClick={() => alert('Intercity corridors: Delhi-Agra, Mumbai-Pune & Bengaluru-Mysuru.')}
                className="flex items-center gap-2 font-semibold text-xs text-gray-400 hover:text-white pb-2"
              >
                <span>🛣️</span> Intercity
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-yellow-400 animate-ping"></span>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-yellow-400">
                  AI Neural Engine
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Go anywhere with <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400">RideNow</span>
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Sub-minute dispatch, algorithmic transparent pricing in ₹ INR, and verified partner fleet.
              </p>
            </div>

            {bookingError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-2xl flex items-center gap-2 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Location Inputs */}
            <div className="space-y-3">
              {/* Pickup */}
              <div className="relative">
                <div className="absolute left-3.5 top-3.5 flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"></span>
                </div>
                <input
                  type="text"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder={t('pickupLocation')}
                  className="w-full bg-[#141418] border border-yellow-500/20 rounded-2xl py-3 pl-9 pr-24 text-xs font-semibold text-white focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPickup('Current Location (Connaught Place, New Delhi)');
                    setPickupCoord({ lat: 28.6328, lng: 77.2197 });
                  }}
                  className="absolute right-3 top-2.5 text-[10px] font-extrabold text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 px-2.5 py-1 rounded-lg border border-yellow-400/30 transition shadow-xs"
                >
                  Current
                </button>
              </div>

              {/* Destination */}
              <div className="relative">
                <div className="absolute left-3.5 top-3.5 flex items-center justify-center">
                  <span className="w-2.5 h-2.5 bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"></span>
                </div>
                <input
                  type="text"
                  value={drop}
                  onChange={(e) => setDrop(e.target.value)}
                  placeholder={t('dropoffLocation')}
                  className="w-full bg-[#141418] border border-yellow-500/20 rounded-2xl py-3 pl-9 pr-10 text-xs font-semibold text-white focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
              </div>

              {/* Quick Destination Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {POPULAR_LOCATIONS.slice(0, 3).map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDrop(loc.name);
                      setDropCoord({ lat: loc.lat, lng: loc.lng });
                    }}
                    className="text-[10px] bg-[#141418] hover:bg-[#1f1f26] text-gray-300 hover:text-white px-2.5 py-1 rounded-full font-medium truncate max-w-[170px] border border-yellow-500/15 transition"
                  >
                    📍 {loc.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Ride Categories Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                  Fleet Category
                </label>
                <span className="text-xs text-yellow-400 font-mono font-bold">
                  {distanceKm} km • ~{durationMinutes} mins
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'AUTO', name: 'RideNow Auto', icon: '🛺', desc: 'Ubiquitous 3-wheeler, upfront meter rates' },
                  { id: 'BIKE', name: 'RideNow Moto', icon: '🏍️', desc: 'Fastest solo transit through traffic' },
                  { id: 'MINI', name: 'RideNow Mini', icon: '🚗', desc: 'Comfy hatchbacks at everyday fares' },
                  { id: 'SEDAN', name: 'RideNow Premier', icon: '🚘', desc: 'Spacious sedans with top-rated drivers' },
                  { id: 'SUV', name: 'RideNow XL', icon: '🚙', desc: 'Room for 6 passengers, Ertiga & Innova' }
                ].map((cat) => {
                  const est = estimates.find((e) => e.category === cat.id);
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={`cursor-pointer flex items-center justify-between p-3.5 rounded-2xl border transition-all ${isSelected
                          ? 'border-yellow-400 bg-yellow-400/10 ring-1 ring-yellow-400 shadow-neon-yellow-sm'
                          : 'border-yellow-500/10 hover:border-yellow-500/30 bg-[#141418]'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black text-white">{cat.name}</h4>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400" />}
                          </div>
                          <p className="text-[10px] text-gray-400">{cat.desc}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-mono font-black text-white">
                          ₹{est ? est.totalFare : '...'}
                        </div>
                        {est && est.discountAmount > 0 && (
                          <div className="text-[10px] text-yellow-400 font-bold font-mono">
                            -₹{est.discountAmount} saved
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Promo Code Box */}
            <div className="bg-[#141418] p-2.5 rounded-2xl border border-yellow-500/20 flex items-center gap-2">
              <Tag className="w-4 h-4 text-yellow-400 shrink-0" />
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="PROMO CODE"
                className="w-full bg-transparent text-xs font-mono font-black uppercase tracking-wider text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-yellow-400 text-black text-xs font-black px-3.5 py-1.5 rounded-xl transition shrink-0 shadow-neon-yellow-sm"
              >
                Apply
              </button>
            </div>

            {appliedPromo && (
              <div className="text-xs text-yellow-300 bg-yellow-950/40 border border-yellow-700/60 rounded-xl px-3 py-2 flex items-center justify-between">
                <span>Code <strong>{appliedPromo.code}</strong> applied! ({appliedPromo.discountPercent}% OFF)</span>
                <span className="font-mono font-bold">-₹{appliedPromo.discountAmount}</span>
              </div>
            )}
            {promoError && (
              <div className="text-xs text-red-300 bg-red-950/60 border border-red-800 rounded-xl px-3 py-2">
                {promoError}
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="flex items-center justify-between border-t border-yellow-500/20 pt-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                <span>Payment:</span>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black border transition ${paymentMethod === 'CASH'
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black border-yellow-400 shadow-neon-yellow-sm'
                      : 'bg-[#141418] text-gray-400 border-yellow-500/20'
                    }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black border transition ${paymentMethod === 'ONLINE'
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black border-yellow-400 shadow-neon-yellow-sm'
                      : 'bg-[#141418] text-gray-400 border-yellow-500/20'
                    }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Razorpay / UPI</span>
                </button>
              </div>

              {/* SOS Emergency Modal Trigger */}
              <button
                type="button"
                onClick={() => setShowSos(true)}
                className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950 border border-red-500/40 px-2.5 py-1.5 rounded-xl transition shadow-neon-red-sm"
              >
                <Shield className="w-3.5 h-3.5 text-red-500" />
                <span>SOS 112</span>
              </button>
            </div>

            {/* Booking CTA Button (Yellow & Black High-Contrast Mobility Accent) */}
            <button
              onClick={handleBookRide}
              disabled={bookingLoading}
              className="w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 active:scale-[0.99] text-black font-black py-4 rounded-2xl text-sm shadow-neon-yellow transition-all flex items-center justify-center gap-2 tracking-wide"
            >
              {bookingLoading ? (
                'Connecting to Nearby Drivers...'
              ) : (
                <>
                  <Zap className="w-4 h-4 text-black fill-black" />
                  <span>{t('rideNow')}</span>
                  <span className="opacity-70 font-normal">•</span>
                  <span className="font-mono">₹{currentCategoryEstimate?.totalFare || '...'}</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Cyber GPS Map Simulator & Value Props */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#0e0e13]/90 rounded-3xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-yellow-500/20">
              <RiderMap
                pickup={{ name: pickup, lat: pickupCoord.lat, lng: pickupCoord.lng }}
                destination={{ name: drop, lat: dropCoord.lat, lng: dropCoord.lng }}
                onPickupChange={(point) => {
                  setPickup(point.name);
                  setPickupCoord({ lat: point.lat, lng: point.lng });
                }}
                onDestinationChange={(point) => {
                  setDrop(point.name);
                  setDropCoord({ lat: point.lat, lng: point.lng });
                }}
                heightClass="h-[520px]"
              />
            </div>

            {/* Cyber AI Value Props Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#0e0e13]/80 rounded-2xl border border-yellow-500/20">
                <div className="p-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 rounded-xl w-fit mb-2 shadow-neon-yellow-sm">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-white">4-Digit PIN Security</h4>
                <p className="text-[11px] text-gray-400 mt-1">
                  Trip never starts without your verified 4-digit Ride Start PIN code.
                </p>
              </div>

              <div className="p-4 bg-[#0e0e13]/80 rounded-2xl border border-yellow-500/20">
                <div className="p-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 rounded-xl w-fit mb-2 shadow-neon-yellow-sm">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-white">AI Neural Dispatch</h4>
                <p className="text-[11px] text-gray-400 mt-1">
                  Sub-second algorithmic matching with lowest estimated pickup latency.
                </p>
              </div>

              <div className="p-4 bg-[#0e0e13]/80 rounded-2xl border border-yellow-500/20">
                <div className="p-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 rounded-xl w-fit mb-2 shadow-neon-yellow-sm">
                  <Activity className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-white">24/7 SOS 112 Shield</h4>
                <p className="text-[11px] text-gray-400 mt-1">
                  Live encrypted telemetry linked directly to emergency police response 112.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SosModal isOpen={showSos} onClose={() => setShowSos(false)} />
    </div>
  );
};
