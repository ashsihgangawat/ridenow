import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, KeyRound, Cpu, ShieldAlert } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { adminLogin, adminUser, adminToken } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@ridenow.in');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in with admin credentials, redirect to admin dashboard
  React.useEffect(() => {
    const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'];
    if (adminToken && adminUser && adminRoles.includes(adminUser.role)) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [adminToken, adminUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminLogin(email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Administrative authentication failed. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative overflow-hidden font-sans">
      {/* Background Matrix/Circuit Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-neon-yellow-sm group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6 text-black" />
            </span>
            <span className="text-3xl font-black tracking-tight text-white">
              Ride<span className="text-yellow-400">Now</span>
            </span>
          </Link>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs bg-yellow-400/15 border border-yellow-400/40 text-yellow-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-yellow-400" />
              Administrative Command Center
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Restricted access portal for authorized platform administrators
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0c0c10]/95 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.9)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-yellow-400" />
              Admin Authentication
            </h2>
            <span className="text-[10px] bg-red-950/80 border border-red-500/30 text-red-400 font-bold px-2.5 py-0.5 rounded-full uppercase">
              Restricted
            </span>
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
                Administrator Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ridenow.in"
                  className="w-full bg-black/70 border border-neutral-700 focus:border-yellow-400 rounded-2xl py-3 px-4 text-sm font-semibold text-white placeholder-neutral-500 focus:outline-none transition font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-neutral-300">Admin Secret Key / Password</label>
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
                  placeholder="••••••••••••"
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
                  <span>Verifying Administrative Clearance...</span>
                </>
              ) : (
                <>
                  <span>Enter Command Center</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </form>

          {/* Warning / Policy Notice */}
          <div className="mt-6 p-3 bg-neutral-900/70 border border-neutral-800 rounded-2xl text-[11px] text-neutral-400 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-300 font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>No Public Registration</span>
            </div>
            <p>
              Administrative accounts are provisioned exclusively by the Super Administrator via enterprise audit control. All login attempts are immutably logged with client IP.
            </p>
          </div>

          {/* Quick Demo Fill */}
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider mb-2">
              Default Super Admin:
            </p>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@ridenow.in');
                setPassword('Admin@123');
              }}
              className="w-full text-left p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 flex items-center justify-between"
            >
              <span className="font-mono">admin@ridenow.in</span>
              <span className="text-yellow-400 font-mono text-[11px] font-bold">Use</span>
            </button>
          </div>

          {/* Footer Portal Links */}
          <div className="mt-6 text-center text-[11px] text-neutral-500 flex justify-center gap-4">
            <Link to="/rider/login" className="hover:text-yellow-400">Rider Portal</Link>
            <span>•</span>
            <Link to="/driver/login" className="hover:text-yellow-400">Driver Partner Portal</Link>
            <span>•</span>
            <Link to="/" className="hover:text-yellow-400">Gateway</Link>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-neutral-500 font-semibold">
          <ShieldCheck className="w-4 h-4 text-yellow-400" />
          <span>RideNow Enterprise Role-Based Access Control (RBAC)</span>
        </div>
      </div>
    </div>
  );
};

