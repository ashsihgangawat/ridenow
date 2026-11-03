import React, { useState } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { FileText, Upload, CheckCircle2, AlertTriangle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DriverKyc: React.FC = () => {
  const { user, token, refreshUser } = useAuth();
  const [docType, setDocType] = useState('DRIVING_LICENSE');
  const [docNumber, setDocNumber] = useState('DL-042018002931');
  const [fileUrl, setFileUrl] = useState(
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMsg('');
    try {
      const res = await fetch('/api/driver/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          documentType: docType,
          documentNumber: docNumber,
          fileUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Success: ${docType} submitted! Super Admin will review within 24 hours.`);
        refreshUser();
      } else {
        setMsg(`Error: ${data.message}`);
      }
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] cyber-circuit-bg text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/driver" className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-yellow-400 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-white tracking-tight">Driver KYC Verification</h1>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/40 text-yellow-400">
              MVA 2019 COMPLIANCE
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Government mandatory compliance documents required for Indian commercial ride-hailing
          </p>
        </div>

        {msg && (
          <div className={`p-4 rounded-2xl text-xs font-bold border ${
            msg.startsWith('Success') 
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 shadow-neon-cyan' 
              : 'bg-red-950/80 border-red-500/40 text-red-300 shadow-neon-red'
          }`}>
            {msg}
          </div>
        )}

        <div className="bg-[#0e0e13]/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-neon-yellow border border-yellow-500/30 space-y-6">
          <form onSubmit={handleUpload} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-2xl p-3.5 text-xs font-semibold text-white focus:border-yellow-400 focus:outline-none"
              >
                <option value="DRIVING_LICENSE" className="bg-[#141418]">Indian Commercial Driving Licence (DL)</option>
                <option value="VEHICLE_RC" className="bg-[#141418]">Vehicle Registration Certificate (RC)</option>
                <option value="INSURANCE" className="bg-[#141418]">Commercial Vehicle Comprehensive Insurance</option>
                <option value="AADHAAR" className="bg-[#141418]">Driver Aadhaar Card / ID Proof</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">Certificate / Document Number</label>
              <input
                type="text"
                required
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="e.g. DL-042018002931"
                className="w-full bg-black/60 border border-white/10 rounded-2xl p-3.5 text-xs font-mono font-bold text-white focus:border-yellow-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">Document Image / Scan URL</label>
              <input
                type="text"
                required
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-black/60 border border-white/10 rounded-2xl p-3.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
              />
              <p className="text-[11px] text-neutral-500 mt-1">Pre-filled with verified document sample template.</p>
            </div>

            <div className="border border-white/10 rounded-2xl p-3 bg-black/40">
              <p className="text-[11px] font-bold text-neutral-400 uppercase mb-2">Document Preview</p>
              <img
                src={fileUrl}
                alt="Document preview"
                className="h-44 w-full object-cover rounded-xl border border-white/10"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-black py-3.5 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-neon-yellow border border-yellow-400/50"
            >
              <Upload className="w-4 h-4 text-black" />
              <span>{isSubmitting ? 'Uploading to Verification Portal...' : 'Submit Document for Review'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

