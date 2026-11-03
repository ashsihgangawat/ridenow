import React, { useState } from 'react';
import { ShieldAlert, PhoneCall, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId?: string;
}

export const SosModal: React.FC<SosModalProps> = ({ isOpen, onClose, rideId }) => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);

  if (!isOpen) return null;

  const handleTriggerSos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customer/rides/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rideId,
          currentLat: 28.6139,
          currentLng: 77.2090
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data);
      }
    } catch (err) {
      console.error('SOS dispatch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-red-100 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Safety & SOS Emergency</h3>
            <p className="text-xs text-red-600 font-semibold">Instant Police & Support Dispatch</p>
          </div>
        </div>

        {success ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center my-4">
            <CheckCircle className="w-10 h-10 text-red-600 mx-auto mb-2" />
            <h4 className="font-bold text-red-900 text-base">EMERGENCY ALERT BROADCASTED</h4>
            <p className="text-xs text-red-700 mt-1">{success.message}</p>
            <div className="mt-3 py-2 bg-white rounded-xl border border-red-200 text-xs font-mono font-semibold text-red-800">
              Ticket ID: {success.ticketId}
            </div>
            <a
              href="tel:112"
              className="mt-4 flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl text-sm shadow-lg shadow-red-200"
            >
              <PhoneCall className="w-4 h-4" /> Call Police Hotline (112)
            </a>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              If you feel unsafe or are in an emergency, press the button below. Your live trip route, driver
              telemetry, and passenger details will be immediately dispatched to <strong>National Emergency Response 112</strong> and the 24/7 RideNow Safety Operation Center.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-5 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Please only use in real emergency situations. False SOS alerts may result in account termination.
              </p>
            </div>

            <div className="space-y-3">
              <button
                disabled={loading}
                onClick={handleTriggerSos}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 transition-all text-white font-bold py-3.5 rounded-2xl text-base shadow-lg shadow-red-200"
              >
                {loading ? 'Dispatching Live Alert...' : 'CONFIRM SOS EMERGENCY'}
              </button>

              <a
                href="tel:112"
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-2xl text-sm"
              >
                <PhoneCall className="w-4 h-4 text-red-600" /> Dial 112 Directly
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

