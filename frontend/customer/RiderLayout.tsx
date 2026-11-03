import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';
import { Cpu, MapPin, History, User, LogOut, ShieldCheck, Wallet, ChevronRight } from 'lucide-react';

export const RiderLayout: React.FC = () => {
  const { riderUser, riderLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await riderLogout();
    navigate('/rider/login');
  };

  const navLinks = [
    { label: 'Book Ride', path: '/rider/dashboard', icon: MapPin },
    { label: 'My Rides', path: '/rider/history', icon: History },
    { label: 'Profile & Wallet', path: '/rider/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 flex flex-col font-sans">
      {/* Rider Header */}
      <header className="sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-md text-white border-b border-yellow-500/25 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand */}
            <div className="flex items-center gap-8">
              <Link to="/rider/dashboard" className="flex items-center gap-2.5 text-2xl font-black tracking-tight group">
                <span className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-neon-yellow-sm group-hover:scale-105 transition-transform">
                  <Cpu className="w-5 h-5 text-black" />
                </span>
                <span className="font-black tracking-tight text-white">
                  Ride<span className="text-yellow-400">Now</span>
                </span>
                <span className="text-[10px] bg-yellow-400/15 border border-yellow-400/40 text-yellow-400 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Rider
                </span>
              </Link>

              {/* Rider Navigation Links */}
              <nav className="hidden md:flex items-center gap-1.5">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    link.path === '/rider/dashboard'
                      ? location.pathname === '/rider/dashboard' || location.pathname === '/rider'
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

            {/* Right: User Profile & Logout */}
            <div className="flex items-center gap-3">
              {riderUser && (
                <div className="hidden sm:flex items-center gap-3 bg-neutral-900/80 border border-neutral-800 rounded-2xl px-3.5 py-1.5">
                  <div className="w-7 h-7 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center font-black text-xs">
                    {riderUser.fullName ? riderUser.fullName[0].toUpperCase() : 'R'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white leading-tight">
                      {riderUser.fullName || 'Rider'}
                    </p>
                    <p className="text-[10px] text-yellow-400/80 font-mono">
                      ₹{riderUser.customerProfile?.walletBalance ?? '150.00'} credits
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-red-500/50 hover:bg-red-950/30 text-neutral-300 hover:text-red-400 text-xs font-bold transition"
                title="Log out of Rider Portal"
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
              link.path === '/rider/dashboard'
                ? location.pathname === '/rider/dashboard' || location.pathname === '/rider'
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

      {/* Main Rider Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Rider-Specific Footer */}
      <footer className="bg-black text-gray-400 py-8 border-t border-yellow-500/20 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-black text-white">
                Ride<span className="text-yellow-400">Now</span>
              </span>
              <span className="text-[10px] bg-yellow-400/15 border border-yellow-400/40 text-yellow-400 font-bold px-2 py-0.5 rounded">
                RIDER PORTAL
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                GPS Tracked & SOS 112 Enabled
              </span>
              <a href="tel:112" className="text-red-400 hover:underline">National Emergency 112</a>
            </div>
          </div>

          <div className="border-t border-neutral-900 pt-4 text-[11px] text-gray-600 flex flex-wrap justify-between items-center gap-2">
            <p>© 2026 RideNow Technologies Pvt Ltd. Rider Portal.</p>
            <p>Transparent Fares • Zero Surge Surprises • Indian MVA 2019</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

