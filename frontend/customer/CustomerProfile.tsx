import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { User, MapPin, Phone, Shield, Wallet, CheckCircle2, Home, Briefcase, Plus } from 'lucide-react';

export const CustomerProfile: React.FC = () => {
  const { user, token, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [homeAddress, setHomeAddress] = useState(user?.customerProfile?.homeAddress || '');
  const [workAddress, setWorkAddress] = useState(user?.customerProfile?.workAddress || '');
  const [emergencyPhone, setEmergencyPhone] = useState(user?.customerProfile?.emergencyPhone || '');
  const [walletBalance, setWalletBalance] = useState(user?.customerProfile?.walletBalance || 0);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('500');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setHomeAddress(user.customerProfile?.homeAddress || '');
      setWorkAddress(user.customerProfile?.workAddress || '');
      setEmergencyPhone(user.customerProfile?.emergencyPhone || '');
      setWalletBalance(user.customerProfile?.walletBalance || 0);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName,
          homeAddress,
          workAddress,
          emergencyPhone
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Profile and saved places updated successfully!');
        refreshUser();
      } else {
        setMsg(`Error: ${data.message}`);
      }
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTopUp = () => {
    const added = parseFloat(topUpAmount) || 0;
    setWalletBalance((prev: number) => prev + added);
    setMsg(`₹${added} added to your RideNow Wallet!`);
  };

  return (
    <div className="min-h-screen cyber-circuit-bg text-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-black text-white">Customer Profile & Settings</h1>
          <p className="text-xs text-gray-400 mt-1">Manage saved addresses, emergency contacts, and wallet balance</p>
        </div>

        {msg && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{msg}</span>
          </div>
        )}

        {/* Wallet Balance Card (Glowing Black & Yellow) */}
        <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black p-6 rounded-3xl shadow-neon-yellow border border-yellow-300 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-900 font-extrabold uppercase tracking-wider">
              <Wallet className="w-4 h-4 text-black" />
              <span>RideNow Cash & Wallet</span>
            </div>
            <h2 className="text-3xl font-mono font-black text-black mt-1">₹{walletBalance}</h2>
            <p className="text-[11px] text-neutral-800 font-medium mt-0.5">Use balance for instant zero-contact trip payments</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              className="w-24 bg-black/90 border border-black/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-yellow-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleTopUp}
              className="bg-black hover:bg-neutral-900 text-yellow-400 font-black px-4 py-2 rounded-xl text-xs transition shadow-md border border-yellow-400/30"
            >
              Add Money
            </button>
          </div>
        </div>

        {/* Profile & Places Form */}
        <div className="bg-[#0e0e13]/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-yellow-500/20">
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <div>
              <label className="block font-bold text-gray-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#141418] border border-yellow-500/20 rounded-2xl p-3 text-xs font-semibold text-white focus:border-yellow-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-300 mb-1.5">Registered Phone Number</label>
              <input
                type="text"
                disabled
                value={user?.phone || ''}
                className="w-full bg-[#101014] border border-white/5 rounded-2xl p-3 text-xs text-gray-400 font-mono font-bold cursor-not-allowed"
              />
            </div>

            <div className="pt-2 border-t border-yellow-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Home className="w-4 h-4 text-emerald-400" />
                <label className="font-extrabold text-white">Saved Home Address</label>
              </div>
              <input
                type="text"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="e.g. Sector 62, Noida, Uttar Pradesh"
                className="w-full bg-[#141418] border border-yellow-500/20 rounded-2xl p-3 text-xs text-white focus:border-yellow-400 focus:outline-none"
              />
            </div>

            <div className="pt-2 border-t border-yellow-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-yellow-400" />
                <label className="font-extrabold text-white">Saved Work Address</label>
              </div>
              <input
                type="text"
                value={workAddress}
                onChange={(e) => setWorkAddress(e.target.value)}
                placeholder="e.g. DLF Cyber City, Building 10, Gurugram"
                className="w-full bg-[#141418] border border-yellow-500/20 rounded-2xl p-3 text-xs text-white focus:border-yellow-400 focus:outline-none"
              />
            </div>

            <div className="pt-2 border-t border-yellow-500/10">
              <div className="flex items-center gap-2 mb-1.5">
                <Shield className="w-4 h-4 text-red-500" />
                <label className="font-extrabold text-white">Emergency SOS Contact Phone</label>
              </div>
              <p className="text-[11px] text-gray-400 mb-2">
                This number is alerted alongside Police Helpline 112 if you trigger an SOS.
              </p>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+919811199999"
                className="w-full bg-[#141418] border border-yellow-500/20 rounded-2xl p-3 text-xs font-mono font-bold text-white focus:border-yellow-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-yellow-400 text-black font-black py-3.5 rounded-2xl text-xs transition shadow-neon-yellow-sm"
            >
              {saving ? 'Saving Changes...' : 'Save Profile & Addresses'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

