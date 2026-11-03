import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { Download, Star, MapPin, Calendar, Clock, CreditCard, Banknote, Car, CheckCircle } from 'lucide-react';

export const RideHistory: React.FC = () => {
  const { token, user } = useAuth();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/customer/rides/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRides(data.rides);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchHistory();
  }, [token]);

  const handleDownloadReceipt = (ride: any) => {
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>RideNow Tax Invoice - ${ride.bookingCode}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; max-width: 600px; margin: auto; border: 1px solid #ddd; }
          .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 900; }
          .title { font-size: 16px; color: #555; }
          .row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px; }
          .bold { font-weight: bold; }
          .total { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 15px 0; font-size: 18px; margin-top: 20px; }
          .footer { font-size: 11px; color: #777; margin-top: 30px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">RideNow India</div>
          <div class="title">Official Trip Receipt & Tax Invoice</div>
          <div style="font-size: 12px; margin-top: 5px;">GSTIN: 07AAAAA0000A1Z5 | Booking: ${ride.bookingCode}</div>
        </div>
        <div class="row"><span>Date:</span><span>${new Date(ride.createdAt).toLocaleString()}</span></div>
        <div class="row"><span>Passenger:</span><span>${user?.fullName || 'Valued Customer'}</span></div>
        <div class="row"><span>Vehicle Category:</span><span>${ride.vehicleCategory}</span></div>
        <div class="row"><span>Pickup:</span><span style="text-align:right; max-width:300px;">${ride.pickupAddress}</span></div>
        <div class="row"><span>Drop-off:</span><span style="text-align:right; max-width:300px;">${ride.dropAddress}</span></div>
        <div class="row"><span>Distance Traveled:</span><span>${ride.distanceKm} km</span></div>
        
        <div style="margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 10px;">
          <div class="row"><span>Base Fare:</span><span>₹${ride.baseFare.toFixed(2)}</span></div>
          <div class="row"><span>Distance Fare:</span><span>₹${ride.distanceFare.toFixed(2)}</span></div>
          <div class="row"><span>Waiting Charges:</span><span>₹${(ride.waitingCharges || 0).toFixed(2)}</span></div>
          ${ride.discountAmount > 0 ? `<div class="row" style="color:green;"><span>Promo Discount:</span><span>-₹${ride.discountAmount.toFixed(2)}</span></div>` : ''}
          <div class="row total bold">
            <span>Total Amount Paid (${ride.paymentMethod}):</span>
            <span>₹${ride.totalFare.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          Thank you for choosing RideNow. For safety or fare inquiries, contact support@ridenow.in or dial 112 for national emergency response.
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RideNow-Receipt-${ride.bookingCode}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen cyber-circuit-bg text-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">Your Past Trips</h1>
            <p className="text-xs text-gray-400 mt-1">Review trip summaries and download official GST tax receipts</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2"></div>
            <p className="text-xs text-gray-400">Loading trips...</p>
          </div>
        ) : rides.length === 0 ? (
          <div className="bg-[#0e0e13]/90 rounded-3xl p-12 text-center border border-yellow-500/20">
            <Car className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No trips yet</h3>
            <p className="text-xs text-gray-400 mt-1">Book your first ride on the homepage to see it listed here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div
                key={ride.id}
                className="bg-[#0e0e13]/90 backdrop-blur-xl rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.8)] border border-yellow-500/20 hover:border-yellow-500/40 transition space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-yellow-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-gradient-to-r from-yellow-400 to-amber-400 text-black px-2.5 py-1 rounded-xl shadow-neon-yellow-sm">
                      {ride.bookingCode}
                    </span>
                    <span className="text-xs font-bold uppercase bg-[#141418] text-gray-300 px-2.5 py-0.5 rounded-md border border-yellow-500/10">
                      {ride.vehicleCategory}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        ride.status === 'COMPLETED'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                          : ride.status === 'CANCELLED'
                          ? 'bg-red-950/60 text-red-400 border border-red-800'
                          : 'bg-yellow-950/40 text-yellow-400 border border-yellow-700/60'
                      }`}
                    >
                      {ride.status}
                    </span>
                    <span className="text-lg font-mono font-black text-white">₹{ride.totalFare}</span>
                  </div>
                </div>

                {/* Route */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(0,242,254,0.8)]"></span>
                    <span className="font-medium text-gray-200">{ride.pickupAddress}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 bg-yellow-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(250,204,21,0.8)]"></span>
                    <span className="font-medium text-gray-200">{ride.dropAddress}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between pt-2 text-xs text-gray-400 gap-2 border-t border-yellow-500/10">
                  <div className="flex items-center gap-3">
                    <span>{new Date(ride.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{ride.distanceKm} km</span>
                    <span>•</span>
                    <span>Paid via {ride.paymentMethod}</span>
                  </div>

                  <button
                    onClick={() => handleDownloadReceipt(ride)}
                    className="flex items-center gap-1.5 bg-[#141418] hover:bg-[#1f1f26] text-white font-bold px-3 py-1.5 rounded-xl border border-yellow-500/20 hover:border-yellow-400 transition text-xs shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Download Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

