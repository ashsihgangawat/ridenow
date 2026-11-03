import { FareEngine } from '../services/fareEngine.js';
import { TrackingService } from '../services/trackingService.js';
import { db } from '../services/db.js';

export class FareController {
  /**
   * Get fare estimates for all vehicle categories
   */
  static async estimate(req, res) {
    try {
      const { pickupLat, pickupLng, dropLat, dropLng, promoCode } = req.body;

      let distanceKm = 6.5; // Default demo distance
      let durationMinutes = 18;

      if (pickupLat !== undefined && dropLat !== undefined) {
        distanceKm = TrackingService.calculateDistanceKm(
          parseFloat(pickupLat),
          parseFloat(pickupLng),
          parseFloat(dropLat),
          parseFloat(dropLng)
        );
        durationMinutes = Math.max(8, Math.round(distanceKm * 2.8));
      }

      const estimates = FareEngine.estimateAllCategories(distanceKm, durationMinutes, promoCode);

      return res.json({
        success: true,
        distanceKm,
        durationMinutes,
        estimates
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Validate Promo Code
   */
  static async validatePromo(req, res) {
    try {
      const { code, amount = 100 } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: 'Code is required.' });
      }

      const promo = db.promoCodes.findFirst({
        where: { code: code.toUpperCase().trim(), isActive: true }
      });

      if (!promo) {
        return res.status(404).json({ success: false, message: 'Invalid promo code.' });
      }

      if (new Date(promo.validUntil) < new Date()) {
        return res.status(400).json({ success: false, message: 'This promo code has expired.' });
      }

      if (promo.usedCount >= promo.maxUses) {
        return res.status(400).json({ success: false, message: 'Promo code usage limit reached.' });
      }

      if (amount < promo.minRideAmount) {
        return res.status(400).json({
          success: false,
          message: `Minimum ride amount of ₹${promo.minRideAmount} required to use this code.`
        });
      }

      const discount = Math.min((amount * promo.discountPercent) / 100, promo.maxDiscount);

      return res.json({
        success: true,
        promo: {
          code: promo.code,
          description: promo.description,
          discountAmount: Math.round(discount),
          discountPercent: promo.discountPercent
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

