import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';
import { Car, User, Phone, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';

export const DriverSignup: React.FC = () => {
  const { driverSignup, driverToken, driverUser } = useAuth();
  const navigate = useNavigate();

  // Personal fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Vehicle fields
  const [vehicleCategory, setVehicleCategory] = useState('AUTO');
  const [make, setMake] = useState('Bajaj');
  const [model, setModel] = useState('Compact RE');
  const [registrationNumber, setRegistrationNumber] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to driver dashboard
  React.useEffect(() => {
    if (driverToken && driverUser && driverUser.role === 'DRIVER') {
      navigate('/driver/dashboard', { replace: true });
    }
  }, [driverToken, driverUser, navigate]);

  const handleCategoryChange = (cat: string) => {
    setVehicleCategory(cat);
    if (cat === 'AUTO') {
      setMake('Bajaj');
      setModel('Compact RE');
    } else if (cat === 'BIKE') {
      setMake('Hero');
      setModel('Splendor Plus');
    } else if (cat === 'MINI') {
      setMake('Maruti Suzuki');
      setModel('WagonR');
    } else if (cat === 'SEDAN') {
      setMake('Hyundai');
      setModel('Aura');
    } else if (cat === 'SUV') {
      setMake('Maruti Suzuki');
      setModel('Ertiga');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await driverSignup({
        name,
        phone,
        email: email ? email.trim() : undefined,
        password,
        vehicleCategory,
        make,
        model,
        registrationNumber: registrationNumber || `DL 01 RN ${Math.floor(1000 + Math.random() * 9000)}`
      });
      // Redirect to driver dashboard (which shows the Verification Pending banner + link to KYC upload)
      navigate('/driver/dashboard');
    } catch (err: any) {
      setError(err.message || 'Driver partner registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
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
              Driver Partner Onboarding
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Join thousands of daily earners across Delhi NCR, Bengaluru & Mumbai
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0e0e13]/90 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-yellow-400" />
            Partner Registration Form
          </h2>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Details Section */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-yellow-400 mb-3">
                1. Personal Credentials
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-black/70 border border-neutral-700 focus:border-yellow-400 rounded-2xl py-2.5 px-4 text-xs font-semibold text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+9198XXXXXXXX"
                      className="w-full bg-black/70 border border-neutral-700 focus:border-yellow-400 rounded-2xl py-2.5 px-4 text-xs font-mono font-semibold text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="driver@gmail.com"
                      className="w-full bg-black/70 border border-neutral-700 focus:border-yellow-400 rounded-2xl py-2.5 px-4 text-xs font-semibold text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-black/70 border border-neutral-700 focus:border-yellow-400 rounded-2xl py-2.5 px-4 text-xs font-semibold text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Details Section */}
            <div className="pt-2 border-t border-neutral-800">
              <p className="text-[11px] font-black uppercase tracking-wider text-yellow-400 mb-3">
                2. Vehicle Specifications
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">Vehicle Category</label>
                  <div className="grid grid-cols-5 gap-2">
                    {['AUTO', 'MINI', 'SEDAN', 'SUV', 'BIKE'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryChange(cat)}
                        className={`py-2 px-1 text-center rounded-xl text-[11px] font-bold border transition ${
                          vehicleCategory === cat
                            ? 'bg-yellow-400 text-black border-yellow-400 font-black shadow-neon-yellow-sm'
                            : 'bg-black/60 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">Make</label>
                    <input
                      type="text"
                      required
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      className="w-full bg-black/70 border border-neutral-700 focus:border-yellow-400 rounded-2xl py-2 px-3.5 text-xs font-semibold text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">Model</label>
                    <input
                      type="text"
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full bg-black/70 border border-neutral-700 focus:border-yellow-400 rounded-2xl py-2 px-3.5 text-xs font-semibold text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Registration Number (Plate)
                  </label>
                  <input
                    type="text"
                    required
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. DL 01 RN 4521"
                    className="w-full bg-black/70 border border-neutral-700 focus:border-yellow-400 rounded-2xl py-2 px-3.5 text-xs font-mono font-bold text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Note on Verification Pending */}
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-2xl flex items-start gap-2 text-[11px] text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Note: Upon signup, your status will be <strong>PENDING</strong>. You will upload your Driving Licence & RC in the next step for Admin verification.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm rounded-2xl shadow-neon-yellow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Car className="w-4 h-4 animate-spin text-black" />
                  <span>Submitting Driver Application...</span>
                </>
              ) : (
                <>
                  <span>Submit Partner Registration</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center text-xs text-neutral-400 space-y-2">
            <p>
              Already registered as a driver?{' '}
              <Link to="/driver/login" className="text-yellow-400 font-bold hover:underline">
                Sign In
              </Link>
            </p>
            <div className="pt-2 flex justify-center gap-4 text-[11px] text-neutral-500">
              <Link to="/rider/login" className="hover:text-yellow-400">Rider Portal</Link>
              <span>•</span>
              <Link to="/" className="hover:text-yellow-400">Portal Directory</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

