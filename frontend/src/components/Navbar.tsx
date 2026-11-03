import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, Globe, User as UserIcon, Shield, LogOut, Phone, ShieldCheck, Cpu, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    user,
    token,
    logout,
    language,
    setLanguage,
    t,
    loginWithOtp,
    isLoginModalOpen,
    loginModalRole,
    openLoginModal,
    closeLoginModal
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [phone, setPhone] = useState('+919811122233');
  const [otp, setOtp] = useState('1234');
  const [role, setRole] = useState<'CUSTOMER' | 'DRIVER'>('CUSTOMER');
  const [vehicleCategory, setVehicleCategory] = useState('AUTO');
  const [fullName, setFullName] = useState('Rahul Verma');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  React.useEffect(() => {
    if (loginModalRole) setRole(loginModalRole);
  }, [loginModalRole]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role })
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        if (data.demoOtp) setOtp(data.demoOtp);
      } else {
        setLoginError(data.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    try {
      await loginWithOtp(phone, otp, role, { category: vehicleCategory });
      closeLoginModal();
      setOtpSent(false);
      if (role === 'DRIVER') {
        navigate('/driver');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-md text-white border-b border-yellow-500/25 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Nav Links */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 text-2xl font-black tracking-tight group">
                <span className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-neon-yellow-sm group-hover:scale-105 transition-transform">
                  <Cpu className="w-5 h-5 text-black" />
                </span>
                <span className="font-black tracking-tight text-white">
                  Ride<span className="text-yellow-400">Now</span>
                </span>
                <span className="text-[10px] bg-yellow-400/10 border border-yellow-400/40 text-yellow-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest shadow-neon-yellow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping"></span>
                  AI India
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-1.5">
                <Link
                  to="/"
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    location.pathname === '/'
                      ? 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/40 shadow-neon-yellow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t('ride')}
                </Link>
                <Link
                  to="/driver"
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    location.pathname.startsWith('/driver')
                      ? 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/40 shadow-neon-yellow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t('drive')}
                </Link>
                <Link
                  to="/history"
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    location.pathname === '/history'
                      ? 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/40 shadow-neon-yellow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Activity
                </Link>
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-extrabold shadow-neon-yellow-sm'
                      : 'text-yellow-400 hover:bg-yellow-500/10'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              </div>
            </div>

            {/* Right: Language Toggle, Auth & Profile */}
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <div className="flex items-center bg-[#141418] border border-yellow-500/20 rounded-full p-1 text-xs font-bold">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-full transition ${
                    language === 'en' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-black shadow-xs' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('hi')}
                  className={`px-2.5 py-1 rounded-full transition ${
                    language === 'hi' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-black shadow-xs' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  हिन्दी
                </button>
              </div>

              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to={user.role === 'DRIVER' ? '/driver' : '/profile'}
                    className="flex items-center gap-2 text-xs bg-[#141418] border border-yellow-500/30 hover:border-yellow-400 px-3.5 py-1.5 rounded-full transition shadow-neon-yellow-sm"
                    title="Profile & Settings"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="font-bold text-white max-w-[120px] truncate">{user.fullName}</span>
                    <span className="text-[10px] bg-yellow-400/20 text-yellow-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      {user.role}
                    </span>
                  </Link>

                  <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-white/5 rounded-full transition"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openLoginModal('CUSTOMER')}
                    className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 rounded-full transition"
                  >
                    {t('login')}
                  </button>
                  <button
                    onClick={() => openLoginModal('CUSTOMER')}
                    className="bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-black px-4 py-2 rounded-full text-xs font-black transition shadow-neon-yellow-sm active:scale-95"
                  >
                    {t('signup')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Futuristic Black & Yellow OTP Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0d0d12] text-white rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(250,204,21,0.2)] border border-yellow-500/30">
            <button
              onClick={() => {
                closeLoginModal();
                setOtpSent(false);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-yellow-400/10 border border-yellow-400/40 rounded-lg text-yellow-400">
                <Cpu className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-mono font-bold text-yellow-400 uppercase tracking-widest">
                AI Authenticator
              </span>
            </div>

            <div className="mb-5">
              <h3 className="text-2xl font-black text-white">
                {role === 'DRIVER' ? 'Drive with RideNow AI' : 'Ride with RideNow AI'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Enter mobile number for instant verification</p>
            </div>

            {/* Role Tab */}
            <div className="flex bg-[#141418] p-1 rounded-2xl mb-5 border border-yellow-500/20">
              <button
                type="button"
                onClick={() => setRole('CUSTOMER')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
                  role === 'CUSTOMER' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black shadow-xs' : 'text-gray-400 hover:text-white'
                }`}
              >
                Passenger
              </button>
              <button
                type="button"
                onClick={() => setRole('DRIVER')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
                  role === 'DRIVER' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black shadow-xs' : 'text-gray-400 hover:text-white'
                }`}
              >
                Driver Partner
              </button>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-2xl text-xs font-medium">
                {loginError}
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Mobile Number (India)</label>
                  <div className="flex items-center bg-[#141418] border border-yellow-500/20 rounded-2xl overflow-hidden focus-within:border-yellow-400 focus-within:ring-1 focus-within:ring-yellow-400">
                    <span className="px-3 py-3 bg-[#1c1c24] border-r border-yellow-500/20 text-xs font-bold text-yellow-400 font-mono">
                      🇮🇳 +91
                    </span>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full bg-transparent px-3 py-3 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">Demo: +919811122233 (User) or +919876543210 (Driver)</p>
                </div>

                {role === 'DRIVER' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Vehicle Fleet Category</label>
                    <select
                      value={vehicleCategory}
                      onChange={(e) => setVehicleCategory(e.target.value)}
                      className="w-full bg-[#141418] border border-yellow-500/20 rounded-2xl px-3 py-2.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
                    >
                      <option value="AUTO" className="bg-[#141418]">RideNow Auto Rickshaw</option>
                      <option value="BIKE" className="bg-[#141418]">RideNow Moto / Bike</option>
                      <option value="MINI" className="bg-[#141418]">RideNow Mini (Hatchback)</option>
                      <option value="SEDAN" className="bg-[#141418]">RideNow Premier (Sedan)</option>
                      <option value="SUV" className="bg-[#141418]">RideNow XL (6-Seater SUV)</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-black py-3.5 rounded-2xl text-xs transition shadow-neon-yellow-sm"
                >
                  {isSubmitting ? 'Transmitting OTP...' : 'Generate OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Enter 4-Digit Security PIN</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="1234"
                    className="w-full bg-[#141418] border border-yellow-500/40 rounded-2xl px-3 py-3 text-center tracking-widest text-xl font-mono font-black text-yellow-400 focus:border-yellow-400 focus:outline-none"
                  />
                  <p className="text-[11px] text-yellow-400/90 mt-1 font-mono">
                    Demo OTP code: <strong>{otp || '1234'}</strong> (Universal code: 1234)
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="flex-1 bg-[#141418] hover:bg-[#202028] text-gray-300 font-bold py-3 rounded-2xl text-xs transition border border-white/5"
                  >
                    Change Number
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-black py-3 rounded-2xl text-xs transition shadow-neon-yellow-sm"
                  >
                    {isSubmitting ? 'Verifying...' : 'Authorize Session'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
