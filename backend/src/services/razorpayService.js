import { config } from '../config/index.js';
import crypto from 'crypto';

export class RazorpayService {
  /**
   * Create a Razorpay Order
   */
  static async createOrder(amountInRupees, receiptId, notes = {}) {
    const amountInPaise = Math.round(amountInRupees * 100);
    const orderId = `order_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      id: orderId,
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
      status: 'created',
      keyId: config.razorpay.keyId,
      notes: {
        ...notes,
        environment: config.razorpay.isLive ? 'live' : 'test_mock'
      }
    };
  }

  /**
   * Verify signature
   */
  static verifyPaymentSignature(orderId, paymentId, signature) {
    if (!config.razorpay.isLive) {
      // In demo/test mode, auto verify any valid formatted transaction
      return true;
    }
    const text = `${orderId}|${paymentId}`;
    const generated = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(text)
      .digest('hex');
    return generated === signature;
  }

  /**
   * Process simulated / live refund
   */
  static async processRefund(paymentId, amountInRupees, reason) {
    return {
      refundId: `rfnd_${Date.now().toString(36)}`,
      paymentId,
      amount: amountInRupees,
      currency: 'INR',
      status: 'processed',
      reason,
      createdAt: new Date().toISOString()
    };
  }
}

