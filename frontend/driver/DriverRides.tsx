import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { Link } from 'react-router-dom';
import { Car, ArrowLeft, Calendar, MapPin, DollarSign, CheckCircle2, Clock } from 'lucide-react';

export const DriverRides: React.FC = () => {
  const { token, user } = useAuth();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchDriverRides = async () => {
      try {
        const res = await fetch('/api/driver/earnings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.summary?.recentRides) {
          setRides(data.summary.recentRides);
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchDriverRides();
  }, [token]);

  const filtered = rides.filter(r => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  return (
    <div className="min-h-screen bg-[#070709] cyber-circuit-bg text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/driver" className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-yellow-400 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Driver Dashboard
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-white tracking-tight">Partner Trip Archive</h1>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/40 text-yellow-400">
                AUDITED LOGS
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">Review all trips, passenger routes, and settled payouts</p>
          </div>

          <div className="flex bg-[#0e0e13] p-1 rounded-2xl text-xs font-bold border border-white/10">
            {['ALL', 'COMPLETED', 'CANCELLED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl transition ${
                  filter === f ? 'bg-yellow-400 text-black shadow-neon-yellow-sm font-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2 shadow-neon-yellow-sm"></div>
            <p className="text-xs text-neutral-400">Loading trips...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#0e0e13]/90 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/10">
            <Car className="w-12 h-12 text-neutral-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No trips found</h3>
            <p className="text-xs text-neutral-400 mt-1">Completed trips will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((ride) => (
              <div
                key={ride.id}
                className="bg-[#0e0e13]/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/10 hover:border-yellow-500/40 transition space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-black/60 text-yellow-400 px-2.5 py-1 rounded-xl border border-yellow-500/30">
                      #{ride.bookingCode}
                    </span>
                    <span className="text-xs font-black uppercase bg-white/10 text-neutral-200 px-2 py-0.5 rounded-md border border-white/10">
                      {ride.vehicleCategory}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-400">+₹{ride.driverEarnings}</span>
                    <span className="text-[10px] text-neutral-400 block font-medium">
                      Gross: ₹{ride.totalFare} (Commission: ₹{ride.platformCommission})
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0 shadow-neon-cyan"></span>
                    <span className="font-medium text-neutral-200">{ride.pickupAddress}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-2.5 h-2.5 bg-yellow-400 mt-1 shrink-0 shadow-neon-yellow"></span>
                    <span className="font-medium text-neutral-200">{ride.dropAddress}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-neutral-500 border-t border-white/10">
                  <span>{new Date(ride.completedAt || ride.createdAt).toLocaleString()}</span>
                  <span className="font-bold text-neutral-300">Distance: {ride.distanceKm} km</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
