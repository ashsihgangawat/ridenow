import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Car,
  Shield,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  Clock,
  Sparkles,
  Award,
  CheckCircle2,
  Lock,
  Cpu
} from 'lucide-react';

export const PortalGateway: React.FC = () => {
  const { riderUser, driverUser, adminUser } = useAuth();

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Background Neon Yellow Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-yellow-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[300px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-yellow-500/20 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-neon-yellow-sm">
              <Cpu className="w-6 h-6 text-black" />
            </span>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">
                Ride<span className="text-yellow-400">Now</span>
              </span>
              <span className="ml-2 text-[10px] bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                India Mobility
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="text-neutral-400 hidden sm:inline">Emergency Support:</span>
            <a
              href="tel:112"
              className="px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 hover:text-red-200 transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-red-400" />
              <span>National SOS 112</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-extrabold tracking-wider uppercase mb-4 shadow-neon-yellow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Role-Isolated Portal Ecosystem
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            One Mobility Platform. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500">
              Three Independent Portals.
            </span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto">
            Select your destination portal below. Each portal operates with completely isolated sessions,
            backend role authorization, and dedicated interfaces.
          </p>
        </div>

        {/* 3 Portal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto w-full">
          {/* Card 1: Rider Portal */}
          <div className="bg-[#0e0e13]/90 backdrop-blur-xl border border-yellow-500/30 hover:border-yellow-400 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-neon-yellow group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <User className="w-7 h-7" />
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-yellow-400">
                  Portal 01
                </span>
                {riderUser ? (
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                    Active Session
                  </span>
                ) : (
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2.5 py-0.5 rounded-full font-bold">
                    Riders Only
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-black text-white">Rider Portal</h2>
              <p className="text-xs text-neutral-400 mt-2">
                Book cabs, autos, and bikes in seconds with upfront INR fares, live telemetry, and zero surge surprises.
              </p>

              <ul className="mt-6 space-y-2 text-xs text-neutral-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>Instant ride dispatch with 4-digit start OTP</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>Cash & online UPI / Razorpay payment options</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>₹150 welcome credits upon new rider signup</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-800/80 space-y-3">
              {riderUser ? (
                <Link
                  to="/rider/dashboard"
                  className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs rounded-2xl shadow-neon-yellow transition flex items-center justify-center gap-2"
                >
                  <span>Go to Rider Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/rider/login"
                    className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs rounded-2xl shadow-neon-yellow transition flex items-center justify-center gap-2"
                  >
                    <span>Rider Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/rider/signup"
                    className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center"
                  >
                    Create New Rider Account
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Card 2: Driver Partner Portal */}
          <div className="bg-[#0e0e13]/90 backdrop-blur-xl border border-yellow-500/30 hover:border-yellow-400 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-neon-yellow group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-yellow-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Car className="w-7 h-7" />
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-yellow-400">
                  Portal 02
                </span>
                {driverUser ? (
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                    Active Partner
                  </span>
                ) : (
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2.5 py-0.5 rounded-full font-bold">
                    Partners Only
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-black text-white">Driver Partner Portal</h2>
              <p className="text-xs text-neutral-400 mt-2">
                Drive your auto, bike, or cab with 0% introductory commission and instant daily payouts.
              </p>

              <ul className="mt-6 space-y-2 text-xs text-neutral-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>Mandatory MVA 2019 commercial compliance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>Interactive duty toggle & 30s request radar</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>KYC verification portal for DL & RC uploads</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-800/80 space-y-3">
              {driverUser ? (
                <Link
                  to="/driver/dashboard"
                  className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs rounded-2xl shadow-neon-yellow transition flex items-center justify-center gap-2"
                >
                  <span>Go to Driver Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/driver/login"
                    className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs rounded-2xl shadow-neon-yellow transition flex items-center justify-center gap-2"
                  >
                    <span>Driver Partner Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/driver/signup"
                    className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center"
                  >
                    Register Vehicle & Partner Account
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Card 3: Admin Console */}
          <div className="bg-[#0e0e13]/90 backdrop-blur-xl border border-yellow-500/30 hover:border-yellow-400 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-neon-yellow group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-yellow-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7" />
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-yellow-400">
                  Portal 03
                </span>
                <span className="text-[10px] bg-red-950/80 text-red-400 border border-red-800 px-2.5 py-0.5 rounded-full font-bold">
                  Restricted Access
                </span>
              </div>

              <h2 className="text-2xl font-black text-white">Super Admin Console</h2>
              <p className="text-xs text-neutral-400 mt-2">
                Mission control for fleet management, driver KYC approvals, telemetry, financial auditing & security policies.
              </p>

              <ul className="mt-6 space-y-2 text-xs text-neutral-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>Real-time driver document review & verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>Dynamic fare configuration & platform commission</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>Comprehensive audit logs with client IP tracking</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-800/80 space-y-3">
              <Link
                to="/admin/login"
                className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs rounded-2xl shadow-neon-yellow transition flex items-center justify-center gap-2"
              >
                <span>Enter Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-center text-[10px] text-neutral-500">
                No public registration. Super Admin authorization only.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-900 bg-black/80 py-6 text-center text-xs text-neutral-500">
        <p>© 2026 RideNow Technologies Pvt Ltd. Engineered for Indian Smart Mobility.</p>
        <p className="mt-1 text-[11px] text-neutral-600">
          Strict Portal Role Separation Active • Independent LocalStorage Tokens • RBAC Authorization
        </p>
      </footer>
    </div>
  );
};

