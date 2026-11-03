import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';
import { Car, FileText, DollarSign, History, LogOut, ShieldCheck, AlertTriangle, CheckCircle } from 'lucide-react';

export const DriverLayout: React.FC = () => {
  const { driverUser, driverLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await driverLogout();
    navigate('/driver/login');
  };

  const navLinks = [
    { label: 'Duty Dashboard', path: '/driver/dashboard', icon: Car },
    { label: 'KYC Documents', path: '/driver/kyc', icon: FileText },
    { label: 'Daily Earnings', path: '/driver/earnings', icon: DollarSign },
    { label: 'Trip Ledger', path: '/driver/rides', icon: History },
  ];

  const verificationStatus = driverUser?.driverProfile?.verificationStatus || 'PENDING';

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 flex flex-col font-sans">
      {/* Driver Header */}
      <header className="sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-md text-white border-b border-yellow-500/25 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand */}
            <div className="flex items-center gap-8">
              <Link to="/driver/dashboard" className="flex items-center gap-2.5 text-2xl font-black tracking-tight group">
                <span className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-neon-yellow-sm group-hover:scale-105 transition-transform">
                  <Car className="w-5 h-5 text-black" />
                </span>
                <span className="font-black tracking-tight text-white">
                  Ride<span className="text-yellow-400">Now</span>
                </span>
                <span className="text-[10px] bg-yellow-400/15 border border-yellow-400/40 text-yellow-400 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Partner
                </span>
              </Link>

              {/* Driver Navigation */}
              <nav className="hidden md:flex items-center gap-1.5">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    link.path === '/driver/dashboard'
                      ? location.pathname === '/driver/dashboard' || location.pathname === '/driver'
                      : location.pathname.startsWith(link.path);

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-yellow-400 text-black shadow-neon-yellow-sm'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Status badge & Driver Profile */}
            <div className="flex items-center gap-3">
              {/* Verification status pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-wider">
                {verificationStatus === 'APPROVED' ? (
                  <span className="flex items-center gap-1 text-emerald-400 border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 rounded-lg border">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verified Partner
                  </span>
                ) : (
                  <Link
                    to="/driver/kyc"
                    className="flex items-center gap-1 text-amber-400 border-amber-500/30 bg-amber-950/40 px-2 py-0.5 rounded-lg border hover:bg-amber-900/50 transition"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    KYC Pending
                  </Link>
                )}
              </div>

              {driverUser && (
                <div className="hidden sm:flex items-center gap-2.5 bg-neutral-900/80 border border-neutral-800 rounded-2xl px-3 py-1.5">
                  <div className="w-7 h-7 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center font-black text-xs">
                    {driverUser.fullName ? driverUser.fullName[0].toUpperCase() : 'D'}
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-bold text-white leading-tight">{driverUser.fullName || 'Partner'}</p>
                    <p className="text-[10px] text-neutral-400 font-mono">
                      {driverUser.driverProfile?.vehicle?.registrationNumber || 'No Plate'}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-red-500/50 hover:bg-red-950/30 text-neutral-300 hover:text-red-400 text-xs font-bold transition"
                title="Log out of Driver Partner Portal"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around border-t border-neutral-800 py-2 px-4 bg-[#0a0a0d]">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.path === '/driver/dashboard'
                ? location.pathname === '/driver/dashboard' || location.pathname === '/driver'
                : location.pathname.startsWith(link.path);

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-3 rounded-lg ${
                  isActive ? 'text-yellow-400' : 'text-neutral-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Driver Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Driver-Specific Footer */}
      <footer className="bg-black text-gray-400 py-8 border-t border-yellow-500/20 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-black text-white">
                Ride<span className="text-yellow-400">Now</span>
              </span>
              <span className="text-[10px] bg-yellow-400/15 border border-yellow-400/40 text-yellow-400 font-bold px-2 py-0.5 rounded">
                DRIVER PARTNER PORTAL
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Commercial Fleet Telematics & Insurance Protection
              </span>
              <a href="tel:112" className="text-red-400 hover:underline">National Emergency 112</a>
            </div>
          </div>

          <div className="border-t border-neutral-900 pt-4 text-[11px] text-gray-600 flex flex-wrap justify-between items-center gap-2">
            <p>© 2026 RideNow Technologies Pvt Ltd. Driver Partner Division.</p>
            <p>0% Commission Onboarding • Daily UPI Settlements • 24/7 Roadside Assistance</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

