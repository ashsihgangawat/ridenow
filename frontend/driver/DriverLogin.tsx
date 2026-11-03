import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';
import { Cpu, Lock, Car, ArrowRight, ShieldCheck, Phone, AlertCircle } from 'lucide-react';

export const DriverLogin: React.FC = () => {
  const { driverLogin, driverUser, driverToken } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('+919876543210');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in as Driver, redirect to driver dashboard
  React.useEffect(() => {
    if (driverToken && driverUser && driverUser.role === 'DRIVER') {
      navigate('/driver/dashboard', { replace: true });
    }
  }, [driverToken, driverUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await driverLogin({ identifier, password });
      navigate('/driver/dashboard');
    } catch (err: any) {
      setError(err.message || 'Driver partner login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-neon-yellow-sm group-hover:scale-105 transition-transform">
              <Car className="w-6 h-6 text-black" />
            </span>
            <span className="text-3xl font-black tracking-tight text-white">
              Ride<span className="text-yellow-400">Now</span>
            </span>
          </Link>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs bg-yellow-400/15 border border-yellow-400/40 text-yellow-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Driver Partner Portal
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Log in to manage trips, track daily earnings & verify documents
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0e0e13]/90 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <Car className="w-5 h-5 text-yellow-400" />
            Driver Partner Sign In
          </h2>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Registered Mobile Number or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full bg-black/70 border border-neutral-700 focus:border-yellow-400 rounded-2xl py-3 px-4 text-sm font-semibold text-white placeholder-neutral-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-neutral-300">Password</label>
                <span className="text-[11px] text-yellow-400 font-semibold cursor-pointer hover:underline">
                  Demo: Admin@123
                </span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/70 border border-neutral-700 focus:border-yellow-400 rounded-2xl py-3 px-4 text-sm font-semibold text-white placeholder-neutral-500 focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm rounded-2xl shadow-neon-yellow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin text-black" />
                  <span>Signing In Partner...</span>
                </>
              ) : (
                <>
                  <span>Log In to Driver Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-neutral-800">
            <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider mb-2">
              Quick Demo Driver:
            </p>
            <button
              type="button"
              onClick={() => {
                setIdentifier('+919876543210');
                setPassword('Admin@123');
              }}
              className="w-full text-left p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 flex items-center justify-between"
            >
              <span>Driver Partner (+919876543210)</span>
              <span className="text-yellow-400 font-mono text-[11px] font-bold">Use</span>
            </button>
          </div>

          {/* Links */}
          <div className="mt-6 text-center text-xs text-neutral-400 space-y-2">
            <p>
              New driver partner?{' '}
              <Link to="/driver/signup" className="text-yellow-400 font-bold hover:underline">
                Register Vehicle & Partner Account
              </Link>
            </p>
            <div className="pt-2 flex justify-center gap-4 text-[11px] text-neutral-500">
              <Link to="/rider/login" className="hover:text-yellow-400">Rider Portal</Link>
              <span>•</span>
              <Link to="/admin/login" className="hover:text-yellow-400">Admin Console</Link>
            </div>
          </div>
        </div>

        {/* MVA Compliance Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-neutral-500 font-semibold">
          <ShieldCheck className="w-4 h-4 text-yellow-400" />
          <span>Requires Indian Commercial Driving Licence (DL) & RC</span>
        </div>
      </div>
    </div>
  );
};

