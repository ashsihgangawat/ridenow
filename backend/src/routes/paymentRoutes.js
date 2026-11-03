import express from 'express';
import { db } from '../services/db.js';
import { RazorpayService } from '../services/razorpayService.js';
import { rideSocketEvents } from '../sockets/rideSocket.js';
import { config } from '../config/index.js';

const router = express.Router();

/**
 * POST /api/payments/create-order
 * Backend creates Razorpay order with integer paise
 */
router.post('/create-order', async (req, res) => {
  try {
    const { rideId, amountPaise, notes = {} } = req.body;

    if (!rideId) {
      return res.status(400).json({ success: false, message: 'rideId is required' });
    }

    const ride = db.rides.findUnique({ where: { id: rideId } });
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    // Determine amount: passed paise or ride total converted to rupees
    const finalAmountInRupees = amountPaise
      ? amountPaise / 100.0
      : (ride.totalFare || 50.0);

    const order = await RazorpayService.createOrder(
      finalAmountInRupees,
      `rcpt_${rideId.substring(0, 10)}`,
      {
        ...notes,
        rideId,
        bookingCode: ride.bookingCode
      }
    );

    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount, // in integer paise
      currency: order.currency || 'INR',
      keyId: order.keyId || config.razorpay.keyId,
      rideId
    });
  } catch (err) {
    console.error('[Payment Create Order Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/payments/verify
 * Cryptographically verifies Razorpay signature before marking ride as paid
 */
router.post('/verify', async (req, res) => {
  try {
    const {
      rideId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature
    } = req.body;

    if (!rideId || !razorpayPaymentId || !razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: 'rideId, razorpayPaymentId and razorpayOrderId are required'
      });
    }

    const isValid = RazorpayService.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature verification failed'
      });
    }

    // Update Ride record
    const updatedRide = db.rides.update({
      where: { id: rideId },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: 'ONLINE',
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        paidAt: new Date().toISOString()
      }
    });

    // Record transaction
    db.payments.create({
      data: {
        id: `pay_${Date.now()}`,
        rideId,
        amount: updatedRide ? updatedRide.totalFare : 0,
        paymentMethod: 'ONLINE',
        transactionId: razorpayPaymentId,
        orderId: razorpayOrderId,
        status: 'SUCCESS',
      }
    });

    if (updatedRide) {
      rideSocketEvents.notifyRideStatusChanged(updatedRide);
    }

    return res.json({
      success: true,
      message: 'Payment verified and ride marked as paid successfully',
      paymentId: razorpayPaymentId,
      ride: updatedRide
    });
  } catch (err) {
    console.error('[Payment Verify Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/payments/cash
 * Marks ride as cash payment on completion and notifies the driver
 */
router.post('/cash', async (req, res) => {
  try {
    const { rideId } = req.body;
    if (!rideId) {
      return res.status(400).json({ success: false, message: 'rideId is required' });
    }

    const ride = db.rides.findUnique({ where: { id: rideId } });
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    const updatedRide = db.rides.update({
      where: { id: rideId },
      data: {
        paymentMethod: 'CASH',
        paymentStatus: 'PAID_CASH',
        paidAt: new Date().toISOString()
      }
    });

    // Record cash payment
    db.payments.create({
      data: {
        id: `cash_${Date.now()}`,
        rideId,
        amount: ride.totalFare,
        paymentMethod: 'CASH',
        transactionId: `CASH_${Date.now()}`,
        status: 'PAID_CASH',
      }
    });

    if (updatedRide) {
      rideSocketEvents.notifyRideStatusChanged(updatedRide);
    }

    return res.json({
      success: true,
      message: 'Cash payment confirmed on trip completion',
      ride: updatedRide
    });
  } catch (err) {
    console.error('[Payment Cash Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
