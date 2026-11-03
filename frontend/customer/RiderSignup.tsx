import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';
import { Cpu, User, Mail, Phone, Lock, ArrowRight, ShieldCheck, AlertCircle, Gift } from 'lucide-react';

export const RiderSignup: React.FC = () => {
  const { riderSignup, riderToken, riderUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to rider dashboard
  React.useEffect(() => {
    if (riderToken && riderUser && (riderUser.role === 'RIDER' || riderUser.role === 'CUSTOMER')) {
      navigate('/rider/dashboard', { replace: true });
    }
  }, [riderToken, riderUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await riderSignup({
        name,
        email: email ? email.trim() : undefined,
        phone,
        password
      });
      navigate('/rider/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative overflow-hidden">
      {/* Accent glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-neon-yellow-sm group-hover:scale-105 transition-transform">
              <Cpu className="w-6 h-6 text-black" />
            </span>
            <span className="text-3xl font-black tracking-tight text-white">
              Ride<span className="text-yellow-400">Now</span>
            </span>
          </Link>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs bg-yellow-400/15 border border-yellow-400/40 text-yellow-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Rider Portal Registration
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Sign up now and get ₹150 welcome ride credits instantly
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0e0e13]/90 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <User className="w-5 h-5 text-yellow-400" />
              Create Rider Account
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-bold bg-yellow-400/10 px-2.5 py-1 rounded-full border border-yellow-400/30">
              <Gift className="w-3.5 h-3.5" />
              <span>₹150 Bonus</span>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full bg-black/70 border border-neutral-700 focus:border-yellow-400 rounded-2xl py-3 px-4 text-sm font-semibold text-white placeholder-neutral-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                10-digit Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+9198XXXXXXXX"
                  className="w-full bg-black/70 border border-neutral-700 focus:border-yellow-400 rounded-2xl py-3 px-4 text-sm font-mono font-semibold text-white placeholder-neutral-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Email Address <span className="text-neutral-500 text-[10px]">(Optional for receipts)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full bg-black/70 border border-neutral-700 focus:border-yellow-400 rounded-2xl py-3 px-4 text-sm font-semibold text-white placeholder-neutral-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Create Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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
                  <span>Registering Rider Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Rider Registration</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center text-xs text-neutral-400 space-y-2">
            <p>
              Already have a rider account?{' '}
              <Link to="/rider/login" className="text-yellow-400 font-bold hover:underline">
                Sign In
              </Link>
            </p>
            <div className="pt-2 flex justify-center gap-4 text-[11px] text-neutral-500">
              <Link to="/driver/signup" className="hover:text-yellow-400">Drive with us</Link>
              <span>•</span>
              <Link to="/" className="hover:text-yellow-400">All Portals</Link>
            </div>
          </div>
        </div>

        {/* Safety Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-neutral-500 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>By signing up, you accept RideNow Rider Terms & Safety Guidelines</span>
        </div>
      </div>
    </div>
  );
};

