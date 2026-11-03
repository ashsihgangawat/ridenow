import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';
import { useSocket } from '../src/context/SocketContext';
import { RiderMap } from '../src/components/maps/RiderMap';
import { SosModal } from '../src/components/SosModal';
import { RazorpayModal } from '../src/components/RazorpayModal';
import { RideChatDrawer } from '../src/components/chat/RideChatDrawer';
import {
  Phone,
  PhoneCall,
  MessageSquare,
  Sparkles,
  Shield,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CreditCard,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const ActiveRideView: React.FC = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const { token, user } = useAuth();
  const { socket, joinRideRoom } = useSocket();
  const navigate = useNavigate();

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSos, setShowSos] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Found another ride');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('Smooth, safe drive and polite driver partner!');
  const [paidOnline, setPaidOnline] = useState(false);
  const [liveDriverLoc, setLiveDriverLoc] = useState<{ lat: number; lng: number; heading?: number } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch Unread Messages
  const fetchUnreadCount = async () => {
    if (!rideId || !token) return;
    try {
      const res = await fetch(`/api/chat/${rideId}/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    } catch (e) {
      // ignore
    }
  };

  // Fetch Ride Details
  const fetchRide = async () => {
    try {
      const res = await fetch(`/api/customer/rides/${rideId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.ride) {
        setRide(data.ride);
        if (data.ride.status === 'COMPLETED' && !data.ride.review) {
          setShowRatingModal(true);
        }
      }
    } catch (err) {
      console.warn('Fetch ride error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rideId) {
      fetchRide();
      fetchUnreadCount();
      joinRideRoom(rideId);
    }
  }, [rideId]);

  // Listen for real-time Socket events
  useEffect(() => {
    if (!socket) return;

    const handleAccepted = (data: any) => {
      if (data.ride?.id === rideId) {
        setRide((prev: any) => ({ ...prev, ...data.ride, driver: data.driver }));
      }
    };

    const handleStatusUpdate = (data: any) => {
      if (data.ride?.id === rideId) {
        setRide((prev: any) => ({ ...prev, ...data.ride }));
        if (data.ride.status === 'COMPLETED') {
          setShowRatingModal(true);
        }
      }
    };

    const handleDriverLocation = (data: any) => {
      if (data.rideId === rideId || (ride?.driverId && data.driverId === ride.driverId)) {
        setLiveDriverLoc({ lat: data.lat, lng: data.lng, heading: data.heading });
      }
    };

    const handleChatMessage = (msg: any) => {
      if (msg.rideId === rideId && !isChatOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on('ride_accepted', handleAccepted);
    socket.on('ride_status_updated', handleStatusUpdate);
    socket.on('driver_location_update', handleDriverLocation);
    socket.on('live_driver_moved', handleDriverLocation);
    socket.on('ride_chat_message', handleChatMessage);
    socket.on('new_chat_message', handleChatMessage);

    return () => {
      socket.off('ride_accepted', handleAccepted);
      socket.off('ride_status_updated', handleStatusUpdate);
      socket.off('driver_location_update', handleDriverLocation);
      socket.off('live_driver_moved', handleDriverLocation);
      socket.off('ride_chat_message', handleChatMessage);
      socket.off('new_chat_message', handleChatMessage);
    };
  }, [socket, rideId, isChatOpen]);

  // Handle Cancel Ride
  const handleCancelRide = async () => {
    try {
      const res = await fetch(`/api/customer/rides/${rideId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: cancelReason })
      });
      const data = await res.json();
      if (data.success) {
        setShowCancelModal(false);
        fetchRide();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Rating Submission
  const handleRateRide = async () => {
    try {
      const res = await fetch(`/api/customer/rides/${rideId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rating,
          comment,
          tags: ['Polite Driver', 'Clean Vehicle', 'Safe Driving']
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowRatingModal(false);
        navigate('/rider/dashboard');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-gray-700">Connecting with your RideNow driver...</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-3xl shadow-lg border border-gray-200">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Trip not found</h2>
          <p className="text-xs text-gray-500 mt-2">The requested booking does not exist or has expired.</p>
          <button
            onClick={() => navigate('/rider/dashboard')}
            className="mt-6 w-full bg-black text-white font-bold py-3 rounded-2xl text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (ride.status) {
      case 'REQUESTED':
        return { label: 'AI Neural Matching in progress...', color: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30 shadow-neon-yellow-sm animate-pulse' };
      case 'ACCEPTED':
        return { label: 'Driver en route to pickup location', color: 'bg-yellow-400/15 text-yellow-300 border-yellow-400/40 shadow-neon-yellow-sm' };
      case 'ARRIVED':
        return { label: 'Driver arrived at pickup point', color: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40 font-bold' };
      case 'IN_PROGRESS':
        return { label: 'Trip in progress to destination', color: 'bg-yellow-400/15 text-yellow-300 border-yellow-400/50 font-black shadow-neon-yellow-sm' };
      case 'COMPLETED':
        return { label: 'Trip Completed', color: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40 font-bold' };
      case 'CANCELLED':
        return { label: 'Trip Cancelled', color: 'bg-red-950/40 text-red-400 border-red-500/40' };
      default:
        return { label: ride.status, color: 'bg-[#141418] text-gray-300 border-yellow-500/20' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="min-h-screen cyber-circuit-bg text-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active Ride Telemetry & Driver Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-3xl border backdrop-blur-md ${statusBadge.color} flex items-center justify-between`}>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Live Telemetry</p>
              <h3 className="text-sm font-black mt-0.5">{statusBadge.label}</h3>
            </div>
            <span className="font-mono text-xs font-black bg-black/60 px-3 py-1 rounded-xl border border-white/10 text-yellow-400">
              {ride.bookingCode}
            </span>
          </div>

          {/* 4-Digit Ride Start PIN Box (Black & Yellow High-Contrast Card) */}
          <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black p-5 rounded-3xl shadow-neon-yellow border border-yellow-300 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-900 font-extrabold uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>Ride Start PIN</span>
              </div>
              <p className="text-[11px] text-neutral-800 font-medium mt-1">Share this PIN with driver partner to begin trip</p>
            </div>
            <div className="bg-black text-yellow-400 text-2xl font-black tracking-widest px-4 py-2 rounded-2xl shadow-inner font-mono border border-yellow-400/50 shadow-neon-yellow-sm">
              {ride.otp}
            </div>
          </div>

          {/* Assigned Driver Details Card */}
          {ride.driver ? (
            <div className="bg-[#0e0e13]/95 backdrop-blur-xl p-6 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-yellow-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 text-black flex items-center justify-center text-xl font-black shadow-neon-yellow-sm">
                    {ride.driver.name?.[0] || 'D'}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">{ride.driver.name}</h4>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-white">{ride.driver.rating || '4.9'}</span>
                      <span className="text-yellow-400 font-medium">• Verified Partner</span>
                    </div>
                  </div>
                </div>

                <a
                  href={`tel:${ride.driver.phone || '+919876543210'}`}
                  className="p-3 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 rounded-2xl transition border border-yellow-400/30 shadow-neon-yellow-sm flex items-center gap-1.5 text-xs font-bold"
                  title="Call Driver"
                >
                  <PhoneCall className="w-4 h-4 text-yellow-400" />
                  <span className="hidden sm:inline">Call Driver</span>
                </a>
              </div>

              {/* Vehicle Specs */}
              {ride.driver.vehicle && (
                <div className="bg-[#141418] p-3.5 rounded-2xl border border-yellow-500/15 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">
                      {ride.driver.vehicle.make} {ride.driver.vehicle.model}
                    </p>
                    <p className="text-gray-400 text-[11px]">{ride.driver.vehicle.color} • {ride.vehicleCategory}</p>
                  </div>
                  <div className="bg-black/90 border border-yellow-400/40 font-mono font-black text-sm px-3 py-1 rounded-xl text-yellow-400">
                    {ride.driver.vehicle.registrationNumber}
                  </div>
                </div>
              )}

              {/* Chat & Contact Action Panel */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChatOpen(true);
                      setUnreadCount(0);
                    }}
                    className="flex-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-neon-yellow-sm border border-yellow-400/50 transition relative"
                  >
                    <MessageSquare className="w-4 h-4 text-black" />
                    <span>Chat with Driver</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-black animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <a
                    href={`tel:${ride.driver.phone || '+919876543210'}`}
                    className="px-4 py-3 bg-[#181822] hover:bg-white/10 text-neutral-200 hover:text-white rounded-2xl text-xs font-bold border border-white/15 flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{ride.driver.phone || 'Call'}</span>
                  </a>
                </div>

                {/* Predefined Quick Pickup Chips for Rider */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    Quick Pickup Notes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'I am waiting at pickup location.',
                      'I am near the main gate.',
                      'Please call me when you arrive.'
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setIsChatOpen(true);
                          setUnreadCount(0);
                        }}
                        className="text-[11px] bg-white/5 hover:bg-yellow-400/10 text-neutral-300 hover:text-yellow-400 border border-white/10 hover:border-yellow-400/30 rounded-xl px-2.5 py-1 transition"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0e0e13]/95 backdrop-blur-xl p-6 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-yellow-500/20 text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2"></div>
              <h4 className="text-sm font-bold text-white">Neural Dispatch Scanning...</h4>
              <p className="text-xs text-gray-400">Available partner fleet receiving pickup signal.</p>
            </div>
          )}

          {/* Trip Addresses */}
          <div className="bg-[#0e0e13]/95 backdrop-blur-xl p-6 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-yellow-500/20 space-y-3">
            <h4 className="text-[10px] font-mono font-bold text-yellow-400 uppercase tracking-widest">Route Path</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(0,242,254,0.8)]"></span>
                <div>
                  <p className="text-[10px] font-mono text-gray-400 uppercase">Pickup Location</p>
                  <p className="text-xs font-semibold text-white">{ride.pickupAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 bg-yellow-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(250,204,21,0.8)]"></span>
                <div>
                  <p className="text-[10px] font-mono text-gray-400 uppercase">Destination</p>
                  <p className="text-xs font-semibold text-white">{ride.dropAddress}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-yellow-500/20 flex items-center justify-between text-xs font-semibold text-gray-400">
              <span>Distance: {ride.distanceKm} km</span>
              <span>Fare: <strong className="text-white font-mono font-bold">₹{ride.totalFare}</strong> ({paidOnline ? 'ONLINE PAID' : ride.paymentMethod})</span>
            </div>

            {ride.paymentMethod === 'ONLINE' && !paidOnline && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowRazorpay(true)}
                  className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-yellow-400 text-black font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-neon-yellow-sm transition"
                >
                  <CreditCard className="w-3.5 h-3.5 text-black" />
                  <span>Pay ₹{ride.totalFare} with Razorpay (UPI / Card)</span>
                </button>
              </div>
            )}
            {paidOnline && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Online payment settled via Razorpay India!</span>
              </div>
            )}
          </div>

          {/* Action Buttons: Cancel & SOS */}
          <div className="flex gap-3">
            {['REQUESTED', 'ACCEPTED', 'ARRIVED'].includes(ride.status) && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex-1 bg-[#141418] hover:bg-[#1f1f26] text-gray-300 font-bold py-3 rounded-2xl border border-yellow-500/20 text-xs transition"
              >
                Cancel Ride
              </button>
            )}

            <button
              onClick={() => setShowSos(true)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-2xl text-xs transition flex items-center justify-center gap-1.5 shadow-neon-red-sm"
            >
              <Shield className="w-4 h-4" />
              <span>Safety SOS 112</span>
            </button>
          </div>
        </div>

        {/* Right: Interactive GPS Live Route Map */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0e0e13]/90 rounded-3xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-yellow-500/20">
            <RiderMap
              pickup={{
                name: ride.pickupAddress,
                lat: parseFloat(ride.pickupLatitude) || 22.7196,
                lng: parseFloat(ride.pickupLongitude) || 75.8577
              }}
              destination={{
                name: ride.dropoffAddress,
                lat: parseFloat(ride.dropoffLatitude) || 22.7533,
                lng: parseFloat(ride.dropoffLongitude) || 75.8937
              }}
              activeRide={ride}
              driverLocation={liveDriverLoc || (ride.driver?.currentLat ? { lat: ride.driver.currentLat, lng: ride.driver.currentLng } : undefined)}
              heightClass="h-[540px]"
            />
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-[#121217] text-white border border-yellow-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white">Cancel your ride?</h3>
            <p className="text-xs text-gray-400">Please choose a reason for cancellation:</p>
            <div className="space-y-2">
              {[
                'Driver took too long to arrive',
                'Change of plans / No longer needed',
                'Booked another vehicle by mistake',
                'Driver asked to cancel or demanded extra cash'
              ].map((reason, idx) => (
                <button
                  key={idx}
                  onClick={() => setCancelReason(reason)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-semibold border transition ${
                    cancelReason === reason ? 'border-yellow-400 bg-yellow-400/10 text-yellow-300' : 'border-white/10 hover:border-yellow-500/30 bg-[#181820] text-gray-300'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-[#181820] hover:bg-[#22222c] text-gray-300 font-bold py-2.5 rounded-xl text-xs border border-white/10"
              >
                Keep Ride
              </button>
              <button
                onClick={handleCancelRide}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Trip Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#121217] text-white border border-yellow-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-yellow-400/15 text-yellow-400 rounded-full flex items-center justify-center mx-auto border border-yellow-400/30">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-white">How was your trip?</h3>
            <p className="text-xs text-gray-400">Your feedback helps keep RideNow India safe and reliable.</p>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment for your driver..."
              className="w-full bg-[#181820] border border-yellow-500/20 rounded-2xl p-3 text-xs text-white focus:border-yellow-400 focus:outline-none"
            />

            <button
              onClick={handleRateRide}
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-yellow-400 text-black font-black py-3.5 rounded-2xl text-sm transition shadow-neon-yellow-sm"
            >
              Submit Rating & Return Home
            </button>
          </div>
        </div>
      )}

      {ride?.driver && (
        <RideChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          rideId={ride.id}
          currentUserId={user?.id || ''}
          userRole="RIDER"
          counterpartName={ride.driver.name}
          counterpartPhone={ride.driver.phone}
          vehicleInfo={ride.driver.vehicle ? `${ride.driver.vehicle.make} ${ride.driver.vehicle.model} (${ride.driver.vehicle.registrationNumber})` : undefined}
          rideStatus={ride.status}
          token={token}
          onMessagesRead={() => setUnreadCount(0)}
        />
      )}

      <SosModal isOpen={showSos} onClose={() => setShowSos(false)} rideId={rideId} />
      <RazorpayModal
        isOpen={showRazorpay}
        onClose={() => setShowRazorpay(false)}
        amount={ride.totalFare}
        bookingCode={ride.bookingCode}
        onSuccess={() => {
          setPaidOnline(true);
        }}
      />
    </div>
  );
};

