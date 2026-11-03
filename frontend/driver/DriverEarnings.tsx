import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, Award, CheckCircle2, ArrowLeft } from 'lucide-react';

export const DriverEarnings: React.FC = () => {
  const { token } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawMsg, setWithdrawMsg] = useState('');

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await fetch('/api/driver/earnings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSummary(data.summary);
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchEarnings();
  }, [token]);

  const handleWithdraw = () => {
    setWithdrawMsg('Instant payout initiated! ₹' + (summary?.walletBalance || 0) + ' dispatched to your linked UPI VPA.');
    setTimeout(() => setWithdrawMsg(''), 6000);
  };

  return (
    <div className="min-h-screen bg-[#070709] cyber-circuit-bg text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/driver" className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-yellow-400 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Driver Dashboard
        </Link>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-white tracking-tight">Partner Telemetry & Earnings</h1>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/40 text-yellow-400">
              LIVE SETTLEMENT
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">Track your daily income, trip incentives, and automated Indian banking settlements</p>
        </div>

        {withdrawMsg && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-neon-cyan">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {withdrawMsg}
          </div>
        )}

        {/* Big Earnings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0e0e13]/90 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-yellow-500/30">
            <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Today's Earnings</span>
            <h2 className="text-3xl font-black text-white mt-1">₹{summary?.todayEarnings || 0}</h2>
            <p className="text-xs text-yellow-400 font-bold mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
              {summary?.todayTrips || 0} trips completed today
            </p>
          </div>

          <div className="bg-[#0e0e13]/90 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/10">
            <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Lifetime Revenue</span>
            <h2 className="text-3xl font-black text-white mt-1">₹{summary?.totalEarnings || 0}</h2>
            <p className="text-xs text-neutral-400 font-semibold mt-2">
              {summary?.totalTrips || 0} lifetime completed rides
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#181504] via-[#241c05] to-[#141203] text-white p-6 rounded-3xl shadow-neon-yellow border border-yellow-400/50">
            <span className="text-[11px] font-black text-yellow-300 uppercase tracking-widest">Available Wallet Balance</span>
            <h2 className="text-3xl font-black text-white mt-1">₹{summary?.walletBalance || 0}</h2>
            <button
              onClick={handleWithdraw}
              className="mt-3 w-full bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-yellow-400 text-black font-black py-2.5 rounded-xl text-xs transition shadow-neon-yellow border border-yellow-400/40"
            >
              Transfer to Bank / UPI (Instant)
            </button>
          </div>
        </div>

        {/* Platform Commission Note */}
        <div className="bg-[#0e0e13]/90 backdrop-blur-xl border border-yellow-500/20 rounded-3xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 shadow-neon-yellow-sm">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">Guaranteed 85% Driver Partner Take-Home</h4>
              <p className="text-xs text-neutral-400">
                RideNow charges a flat 15% platform commission on gross fares. Zero hidden deductions.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Rides */}
        <div className="bg-[#0c0e18]/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/10 space-y-4">
          <h3 className="text-lg font-black text-white">Recent Completed Trips</h3>
          {summary?.recentRides?.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-6">No completed trips found today.</p>
          ) : (
            <div className="divide-y divide-white/10">
              {summary?.recentRides?.map((ride: any) => (
                <div key={ride.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-white bg-black/60 px-2.5 py-1 rounded-lg border border-white/10 mr-2">
                      #{ride.bookingCode}
                    </span>
                    <span className="text-neutral-300 truncate inline-block align-middle max-w-[280px]">{ride.dropAddress}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-emerald-400">+₹{ride.driverEarnings}</span>
                    <p className="text-[10px] text-neutral-400">{new Date(ride.completedAt || ride.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

