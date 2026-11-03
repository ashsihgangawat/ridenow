import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useSocket } from '../src/context/SocketContext';
import { DriverMap } from '../src/components/maps/DriverMap';
import { RideChatDrawer } from '../src/components/chat/RideChatDrawer';
import { Link } from 'react-router-dom';
import {
  Power,
  Navigation,
  ShieldCheck,
  Clock,
  Phone,
  PhoneCall,
  MessageSquare,
  Sparkles,
  AlertCircle,
  CheckCircle,
  FileText,
  DollarSign,
  TrendingUp,
  MapPin,
  ChevronRight
} from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const { user, token, refreshUser } = useAuth();
  const { socket } = useSocket();

  const [driverProfile, setDriverProfile] = useState<any>(user?.driverProfile || null);
  const [isOnline, setIsOnline] = useState<boolean>(user?.driverProfile?.isOnline || false);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [requestTimer, setRequestTimer] = useState<number>(30);
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [rideOtp, setRideOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [completedSettlement, setCompletedSettlement] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [passengerContact, setPassengerContact] = useState<{ name: string; phone: string } | null>(null);

  // Fetch passenger contact & unread messages for active ride
  useEffect(() => {
    if (!currentRide?.id || !token) return;

    fetch(`/api/chat/${currentRide.id}/contact`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.contact) {
          setPassengerContact(data.contact);
        }
      })
      .catch((err) => console.warn('Fetch passenger contact error:', err));

    fetch(`/api/chat/${currentRide.id}/unread-count`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
      })
      .catch(() => {});
  }, [currentRide?.id, token]);

  // Real-time chat socket listener
  useEffect(() => {
    if (!socket || !currentRide?.id) return;

    const handleChatMessage = (msg: any) => {
      if (msg.rideId === currentRide.id && !isChatOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on('ride_chat_message', handleChatMessage);
    socket.on('new_chat_message', handleChatMessage);

    return () => {
      socket.off('ride_chat_message', handleChatMessage);
      socket.off('new_chat_message', handleChatMessage);
    };
  }, [socket, currentRide?.id, isChatOpen]);

  // Fetch driver profile
  const fetchDriverData = async () => {
    try {
      const res = await fetch('/api/driver/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.driver) {
        setDriverProfile(data.driver);
        setIsOnline(data.driver.isOnline);
        if (data.driver.activeRide) {
          setCurrentRide(data.driver.activeRide);
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    if (token) fetchDriverData();
  }, [token]);

  // Handle Online / Offline toggle
  const handleToggleOnline = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch('/api/driver/toggle-online', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          isOnline: !isOnline,
          lat: 28.6139,
          lng: 77.2090
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsOnline(data.isOnline);
        setDriverProfile((prev: any) => ({ ...prev, isOnline: data.isOnline }));
      } else {
        alert(data.message || 'Cannot toggle availability');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Poll for nearby pending requests if online
  useEffect(() => {
    let interval: any;
    if (isOnline && !currentRide && !activeRequest) {
      const checkRequests = async () => {
        try {
          const res = await fetch('/api/driver/requests', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.requests?.length > 0) {
            setActiveRequest(data.requests[0]);
            setRequestTimer(30);
          }
        } catch (e) {
          // ignore
        }
      };
      checkRequests();
      interval = setInterval(checkRequests, 5000);
    }
    return () => clearInterval(interval);
  }, [isOnline, currentRide, activeRequest, token]);

  // Request countdown timer
  useEffect(() => {
    let timer: any;
    if (activeRequest && requestTimer > 0) {
      timer = setInterval(() => {
        setRequestTimer((prev) => {
          if (prev <= 1) {
            setActiveRequest(null);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeRequest, requestTimer]);

  // Accept Ride
  const handleAcceptRide = async () => {
    if (!activeRequest) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/driver/rides/${activeRequest.id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCurrentRide(data.ride);
        setActiveRequest(null);
      } else {
        alert(data.message);
        setActiveRequest(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  // Arrived At Pickup
  const handleArrived = async () => {
    if (!currentRide) return;
    try {
      const res = await fetch(`/api/driver/rides/${currentRide.id}/arrived`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCurrentRide(data.ride);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Start Ride with Passenger 4-Digit PIN
  const handleStartRide = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    try {
      const res = await fetch(`/api/driver/rides/${currentRide.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ otp: rideOtp })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentRide(data.ride);
        setRideOtp('');
      } else {
        setOtpError(data.message || 'Invalid PIN code');
      }
    } catch (e: any) {
      setOtpError(e.message);
    }
  };

  // Complete Ride
  const handleCompleteRide = async () => {
    if (!currentRide) return;
    try {
      const res = await fetch(`/api/driver/rides/${currentRide.id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCompletedSettlement({
          earnings: data.earnings || currentRide.driverEarnings,
          totalFare: currentRide.totalFare,
          commission: currentRide.platformCommission,
          bookingCode: currentRide.bookingCode
        });
        setCurrentRide(null);
        fetchDriverData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isApproved = driverProfile?.verificationStatus === 'APPROVED';

  return (
    <div className="min-h-screen bg-[#07080e] cyber-circuit-bg text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Verification Alert Banner if Pending */}
        {!isApproved && (
          <div className="bg-[#141208]/90 border-2 border-amber-500/50 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-amber-400 shrink-0 animate-pulse" />
              <div>
                <h4 className="font-black text-amber-300 text-sm tracking-wide">Account Verification Required</h4>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Your Driving Licence and Vehicle RC are under review. Super Admin must approve your profile before you can go online.
                </p>
              </div>
            </div>
            <Link
              to="/driver/kyc"
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20"
            >
              Upload Documents
            </Link>
          </div>
        )}

        {/* Driver Top Header Card */}
        <div className="bg-[#0e0e13]/90 backdrop-blur-xl rounded-3xl p-6 shadow-neon-yellow border border-yellow-500/30 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 text-black flex items-center justify-center text-2xl font-black shadow-neon-yellow-sm border border-yellow-400/40">
              {user?.fullName?.[0] || 'D'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight">{user?.fullName || 'Driver Partner'}</h2>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    isApproved
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {driverProfile?.verificationStatus || 'PENDING'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                {driverProfile?.vehicle?.make} {driverProfile?.vehicle?.model} • <span className="font-mono text-neutral-300">{driverProfile?.vehicle?.registrationNumber}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-6 text-center border-x border-white/10 px-6">
            <div>
              <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Rating</p>
              <p className="text-lg font-black text-yellow-400 mt-0.5">★ {driverProfile?.rating || '5.0'}</p>
            </div>
            <div>
              <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Trips</p>
              <p className="text-lg font-black text-white mt-0.5">{driverProfile?.totalTrips || 0}</p>
            </div>
            <div>
              <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Wallet</p>
              <p className="text-lg font-black text-emerald-400 mt-0.5">₹{driverProfile?.walletBalance || 0}</p>
            </div>
          </div>

          {/* Online / Offline Switch */}
          <div>
            <button
              onClick={handleToggleOnline}
              disabled={loadingAction || !isApproved}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all shadow-lg ${
                isOnline
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-neon-cyan border border-emerald-400/50'
                  : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black shadow-neon-yellow border border-yellow-400/50 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <Power className={`w-4 h-4 ${isOnline ? 'animate-pulse text-white' : ''}`} />
              <span>{isOnline ? 'ONLINE • ACCEPTING RIDES' : 'GO ONLINE'}</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Active Ride / Dispatch Panel */}
          <div className="lg:col-span-6 space-y-6">
            {/* INCOMING RIDE REQUEST MODAL / CARD */}
            {activeRequest && (
              <div className="bg-[#0e0e13]/95 backdrop-blur-xl border-2 border-yellow-400 rounded-3xl p-6 shadow-neon-yellow space-y-5 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-black bg-yellow-400/10 text-yellow-400 border border-yellow-400/40 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
                    NEW DISPATCH TELEMETRY
                  </span>
                  <div className="text-xs font-black text-yellow-400 font-mono flex items-center gap-1">
                    ⏱️ Auto decline in: {requestTimer}s
                  </div>
                </div>

                <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-2xl font-black text-white">₹{activeRequest.driverEarnings || activeRequest.totalFare}</h3>
                    <p className="text-xs text-neutral-400">Estimated Partner Payout (After 15% Platform cut)</p>
                  </div>
                  <span className="text-xs font-black bg-white/10 text-neutral-200 border border-white/15 px-3 py-1 rounded-xl uppercase">
                    {activeRequest.vehicleCategory}
                  </span>
                </div>

                {/* Pickup & Drop Addresses */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0 shadow-neon-cyan"></span>
                    <div>
                      <p className="text-neutral-400 font-medium">Pickup (1.2 km away)</p>
                      <p className="font-bold text-white mt-0.5">{activeRequest.pickupAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <span className="w-2.5 h-2.5 bg-yellow-400 mt-1 shrink-0 shadow-neon-yellow"></span>
                    <div>
                      <p className="text-neutral-400 font-medium">Destination ({activeRequest.distanceKm} km)</p>
                      <p className="font-bold text-white mt-0.5">{activeRequest.dropAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setActiveRequest(null)}
                    className="flex-1 bg-white/10 hover:bg-white/15 text-neutral-300 font-bold py-3.5 rounded-2xl text-xs transition border border-white/10"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleAcceptRide}
                    disabled={loadingAction}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black py-3.5 rounded-2xl text-sm transition shadow-neon-cyan border border-emerald-400/40"
                  >
                    Accept Ride ({requestTimer}s)
                  </button>
                </div>
              </div>
            )}

            {/* CURRENT ACTIVE RIDE NAVIGATION VIEW */}
            {currentRide && (
              <div className="bg-[#0e0e13]/90 backdrop-blur-xl rounded-3xl p-6 shadow-neon-yellow border border-yellow-500/30 space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Current Trip Telemetry</span>
                    <h3 className="text-lg font-black text-white">Booking #{currentRide.bookingCode}</h3>
                  </div>
                  <span className="text-xs font-black bg-yellow-400 text-black px-3 py-1 rounded-full uppercase shadow-neon-yellow-sm">
                    {currentRide.status}
                  </span>
                </div>

                {/* PASSENGER CONTACT & CHAT SECTION */}
                <div className="bg-[#14141a] p-4 rounded-2xl border border-yellow-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 flex items-center justify-center font-black text-sm">
                        {passengerContact?.name?.[0] || 'P'}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">{passengerContact?.name || 'Passenger Partner'}</h4>
                        <p className="text-[10px] text-neutral-400">Assigned Passenger • Active Booking</p>
                      </div>
                    </div>

                    {passengerContact?.phone && (
                      <a
                        href={`tel:${passengerContact.phone}`}
                        className="p-2.5 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 rounded-xl transition border border-yellow-400/30 shadow-neon-yellow-sm flex items-center gap-1.5 text-xs font-bold"
                        title={`Call passenger at ${passengerContact.phone}`}
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="hidden sm:inline">Call Rider</span>
                      </a>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsChatOpen(true);
                        setUnreadCount(0);
                      }}
                      className="flex-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-neon-yellow-sm transition relative"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-black" />
                      <span>Chat with Rider</span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-black animate-bounce">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {passengerContact?.phone && (
                      <a
                        href={`tel:${passengerContact.phone}`}
                        className="px-3.5 py-2.5 bg-[#1e1e28] hover:bg-white/10 text-neutral-200 hover:text-white rounded-xl text-xs font-bold border border-white/10 flex items-center justify-center gap-1 transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-yellow-400" />
                        <span>{passengerContact.phone}</span>
                      </a>
                    )}
                  </div>

                  {/* Predefined Driver Quick Notes */}
                  <div className="space-y-1 pt-1">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-yellow-400" />
                      Quick Driver Updates
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'I am on my way.',
                        'I have reached pickup.',
                        'Please come to pickup point.'
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setIsChatOpen(true);
                            setUnreadCount(0);
                          }}
                          className="text-[10px] bg-white/5 hover:bg-yellow-400/10 text-neutral-300 hover:text-yellow-400 border border-white/10 hover:border-yellow-400/30 rounded-lg px-2.5 py-1 transition"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 1: Arrived at Pickup */}
                {currentRide.status === 'ACCEPTED' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-xs text-cyan-200">
                      Drive to pickup: <strong className="text-white block mt-1">{currentRide.pickupAddress}</strong>
                    </div>
                    <button
                      onClick={handleArrived}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-3.5 rounded-2xl text-sm transition shadow-neon-cyan border border-cyan-400/30"
                    >
                      I Have Arrived at Pickup
                    </button>
                  </div>
                )}

                {/* Step 2: Enter Passenger 4-Digit PIN */}
                {currentRide.status === 'ARRIVED' && (
                  <form onSubmit={handleStartRide} className="space-y-4">
                    <div className="p-4 bg-yellow-950/40 border border-yellow-500/30 rounded-2xl text-xs text-yellow-200">
                      Passenger is boarding. Ask customer for their <strong className="text-white">4-digit Ride Start PIN</strong>.
                    </div>

                    {otpError && (
                      <p className="text-xs font-semibold text-red-400 bg-red-950/60 border border-red-800 p-2.5 rounded-xl">{otpError}</p>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1.5">Enter 4-Digit Passenger PIN</label>
                      <input
                        type="text"
                        maxLength={4}
                        required
                        value={rideOtp}
                        onChange={(e) => setRideOtp(e.target.value)}
                        placeholder="e.g. 1234"
                        className="w-full bg-black/60 border-2 border-yellow-500/40 rounded-2xl px-4 py-3.5 text-center font-mono text-2xl font-black tracking-widest text-yellow-400 focus:border-yellow-400 focus:outline-none shadow-neon-yellow-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-yellow-400 text-black font-black py-3.5 rounded-2xl text-sm transition shadow-neon-yellow-sm"
                    >
                      Verify PIN & Start Trip
                    </button>
                  </form>
                )}

                {/* Step 3: Trip in Progress -> Complete */}
                {currentRide.status === 'IN_PROGRESS' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-xs text-indigo-200 space-y-1">
                      <p className="font-bold text-neutral-400 uppercase tracking-wider text-[10px]">Trip in progress to destination:</p>
                      <p className="text-white font-semibold text-sm">{currentRide.dropAddress}</p>
                    </div>

                    <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 flex justify-between text-xs items-center">
                      <span className="text-neutral-400">Collect from Passenger:</span>
                      <strong className="text-emerald-400 text-base font-black">₹{currentRide.totalFare} ({currentRide.paymentMethod})</strong>
                    </div>

                    <button
                      onClick={handleCompleteRide}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black py-3.5 rounded-2xl text-sm transition shadow-neon-cyan border border-emerald-400/40"
                    >
                      Complete Trip & Settle Earnings
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Default Status when Idle */}
            {!activeRequest && !currentRide && (
              <div className="bg-[#0c0e18]/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/10 text-center space-y-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${
                  isOnline
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 shadow-neon-cyan'
                    : 'bg-white/5 text-neutral-500 border-white/10'
                }`}>
                  <Navigation className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-white">
                  {isOnline ? 'AI Telemetry Radar Active' : 'You are currently Offline'}
                </h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  {isOnline
                    ? 'High-demand clusters detected near Connaught Place & Airport T3. Stand by for instant dispatch.'
                    : 'Switch your status to Online to start receiving pickup requests in your city.'}
                </p>
              </div>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link
                to="/driver/earnings"
                className="bg-[#0e0e13]/80 hover:bg-[#16161f] p-4 rounded-3xl border border-white/10 hover:border-yellow-500/40 shadow-sm transition flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-xs font-black text-white group-hover:text-yellow-400 transition">Earnings</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Daily income</p>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-yellow-400 transition" />
              </Link>

              <Link
                to="/driver/rides"
                className="bg-[#0e0e13]/80 hover:bg-[#16161f] p-4 rounded-3xl border border-white/10 hover:border-yellow-500/40 shadow-sm transition flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-xs font-black text-white group-hover:text-yellow-400 transition">Trip History</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Past rides</p>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-yellow-400 transition" />
              </Link>

              <Link
                to="/driver/kyc"
                className="bg-[#0e0e13]/80 hover:bg-[#16161f] p-4 rounded-3xl border border-white/10 hover:border-yellow-500/40 shadow-sm transition flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-xs font-black text-white group-hover:text-yellow-400 transition">KYC Docs</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Compliance</p>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-yellow-400 transition" />
              </Link>
            </div>
          </div>

          {/* Right Column: Driver Live GPS Map Simulator */}
          <div className="lg:col-span-6">
            <div className="bg-[#0e0e13]/90 backdrop-blur-xl rounded-3xl p-3 shadow-neon-yellow border border-yellow-500/30">
              <DriverMap
                driverProfile={driverProfile}
                isOnline={isOnline}
                activeRide={currentRide}
                incomingRequest={activeRequest}
                heightClass="h-[520px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Active Ride Chat Drawer */}
      {currentRide && (
        <RideChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          rideId={currentRide.id}
          currentUserId={user?.id || ''}
          userRole="DRIVER"
          counterpartName={passengerContact?.name || 'Passenger Partner'}
          counterpartPhone={passengerContact?.phone}
          rideStatus={currentRide.status}
          token={token}
          onMessagesRead={() => setUnreadCount(0)}
        />
      )}

      {/* Trip Completed Settlement Modal */}
      {completedSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#0e0e13] border border-yellow-500/40 rounded-3xl p-6 shadow-neon-yellow text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-neon-cyan">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Trip Completed!</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Booking #{completedSettlement.bookingCode}</p>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-neutral-400">Gross Passenger Fare:</span>
                <span className="font-bold text-white">₹{completedSettlement.totalFare}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Platform Commission (15%):</span>
                <span>-₹{completedSettlement.commission}</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-black text-emerald-400">
                <span>Net Credited to Wallet:</span>
                <span>+₹{completedSettlement.earnings}</span>
              </div>
            </div>

            <button
              onClick={() => setCompletedSettlement(null)}
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-yellow-400 text-black font-black py-3 rounded-2xl text-xs transition shadow-neon-yellow-sm"
            >
              Ready for Next Trip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

