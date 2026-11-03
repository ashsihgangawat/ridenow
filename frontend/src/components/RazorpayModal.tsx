import React, { useState } from 'react';
import { CreditCard, QrCode, Smartphone, Building, ShieldCheck, CheckCircle2, X, Lock } from 'lucide-react';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  bookingCode: string;
  onSuccess: (paymentDetails: any) => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  onClose,
  amount,
  bookingCode,
  onSuccess
}) => {
  const [method, setMethod] = useState<'UPI_QR' | 'UPI_ID' | 'CARD' | 'NETBANKING'>('UPI_QR');
  const [upiId, setUpiId] = useState('user@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8842');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [processing, setProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  if (!isOpen) return null;

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setIsPaid(true);
      setTimeout(() => {
        onSuccess({
          transactionId: `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
          paymentMethod: 'ONLINE',
          gateway: 'RAZORPAY_INDIA',
          amount,
          bookingCode,
          timestamp: new Date().toISOString()
        });
        onClose();
      }, 1200);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
        {/* Razorpay Brand Header */}
        <div className="bg-[#0c2340] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-black text-sm">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-wide">Razorpay</span>
                <span className="text-[10px] bg-blue-400/20 text-blue-300 font-bold px-1.5 py-0.2 rounded">
                  SECURE
                </span>
              </div>
              <p className="text-[11px] text-gray-300">RideNow Mobility Payments</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-400 block uppercase">Amount to pay</span>
            <span className="text-xl font-black text-white">₹{amount}</span>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {isPaid ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
              <h3 className="text-xl font-black text-gray-950">Payment Successful!</h3>
              <p className="text-xs text-gray-500">
                ₹{amount} paid to RideNow India for trip <strong>{bookingCode}</strong>.
              </p>
            </div>
          ) : (
            <>
              {/* Payment Methods Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('UPI_QR')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition ${
                    method === 'UPI_QR'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <QrCode className="w-5 h-5 mb-1 text-blue-600" />
                  <span>UPI QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('UPI_ID')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition ${
                    method === 'UPI_ID'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mb-1 text-emerald-600" />
                  <span>UPI ID / App</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('CARD')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition ${
                    method === 'CARD'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mb-1 text-indigo-600" />
                  <span>Card</span>
                </button>
              </div>

              {/* Dynamic Method Form */}
              {method === 'UPI_QR' && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-3">
                  <p className="text-xs font-bold text-gray-700">Scan QR using any UPI App (GPay, PhonePe, Paytm)</p>
                  <div className="w-40 h-40 bg-white border-2 border-dashed border-gray-300 rounded-xl mx-auto flex flex-col items-center justify-center p-2 shadow-inner">
                    <QrCode className="w-28 h-28 text-gray-900" />
                    <span className="text-[10px] font-mono text-gray-400 mt-1">UPI ID: ridenow@icici</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold block">
                    ⚡ Auto-approves upon tapping Pay Now
                  </span>
                </div>
              )}

              {method === 'UPI_ID' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Enter UPI VPA / Handle</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. mobile@upi"
                      className="w-full border border-gray-300 rounded-2xl px-3.5 py-3 text-xs font-medium focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">Collect request will be sent to your UPI app for approval.</p>
                </div>
              )}

              {method === 'CARD' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full border border-gray-300 rounded-2xl px-3 py-2.5 font-mono focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full border border-gray-300 rounded-2xl px-3 py-2.5 font-mono focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">CVV</label>
                      <input
                        type="password"
                        maxLength={3}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full border border-gray-300 rounded-2xl px-3 py-2.5 font-mono focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pay Button */}
              <button
                type="button"
                disabled={processing}
                onClick={handlePay}
                className="w-full bg-[#0c2340] hover:bg-[#163863] active:scale-[0.99] text-white font-extrabold py-3.5 rounded-2xl text-sm transition shadow-lg flex items-center justify-center gap-2"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Authorizing with Bank...
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Pay ₹{amount} Securely</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>256-Bit SSL Encrypted • RBI & NPCI Compliant</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

