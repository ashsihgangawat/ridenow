import { db } from './db.js';

export class FareEngine {
  /**
   * Calculate fare for a given vehicle category and distance
   * @param {string} category BIKE | AUTO | MINI | SEDAN | SUV
   * @param {number} distanceKm Distance in kilometers
   * @param {number} durationMinutes Estimated trip duration in minutes
   * @param {string} promoCode Optional promo code
   * @returns {Object} Fare breakdown
   */
  static calculateFare(category, distanceKm, durationMinutes = 15, promoCode = null) {
    const fareConfig = db.fareConfigurations.findFirst({
      where: { category }
    }) || {
      baseFare: 40.0,
      perKmRate: 12.0,
      waitingRateMin: 2.0,
      minimumFare: 50.0,
      surgeMultiplier: 1.0
    };

    // Setting commission rate
    const commSetting = db.systemSettings.findFirst({
      where: { key: 'PLATFORM_COMMISSION_PERCENT' }
    });
    const commissionRate = commSetting ? parseFloat(commSetting.value) : 15.0;

    const baseFare = fareConfig.baseFare;
    const distanceFare = Math.round(distanceKm * fareConfig.perKmRate * 10) / 10;
    
    // Waiting charge (estimated 2 mins by default during normal city traffic)
    const estimatedWaitMinutes = Math.max(0, Math.floor(durationMinutes * 0.15));
    const waitingCharges = Math.round(estimatedWaitMinutes * fareConfig.waitingRateMin * 10) / 10;

    // Surge multiplier
    const surge = fareConfig.surgeMultiplier || 1.0;

    // Formula: Base Fare + (Distance * Per KM) + Waiting Charges
    let subtotal = (baseFare + distanceFare + waitingCharges) * surge;

    // Minimum fare guarantee
    if (subtotal < fareConfig.minimumFare) {
      subtotal = fareConfig.minimumFare;
    }

    subtotal = Math.round(subtotal);

    // Apply Promo Code if valid
    let discount = 0;
    let promoDetails = null;

    if (promoCode) {
      const promo = db.promoCodes.findFirst({
        where: { code: promoCode.toUpperCase().trim(), isActive: true }
      });

      if (promo) {
        const isNotExpired = new Date(promo.validUntil) > new Date();
        const hasUsesLeft = promo.usedCount < promo.maxUses;
        const meetsMinimum = subtotal >= promo.minRideAmount;

        if (isNotExpired && hasUsesLeft && meetsMinimum) {
          const rawDiscount = (subtotal * promo.discountPercent) / 100;
          discount = Math.min(rawDiscount, promo.maxDiscount);
          discount = Math.round(discount);
          promoDetails = {
            code: promo.code,
            discountPercent: promo.discountPercent,
            discountAmount: discount
          };
        }
      }
    }

    const finalTotal = Math.max(0, subtotal - discount);
    const platformCommission = Math.round((finalTotal * (commissionRate / 100)) * 100) / 100;
    const driverEarnings = Math.round((finalTotal - platformCommission) * 100) / 100;

    return {
      category,
      categoryName: fareConfig.name,
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMinutes,
      baseFare,
      distanceFare,
      waitingCharges,
      surgeMultiplier: surge,
      subtotal,
      discountAmount: discount,
      totalFare: finalTotal,
      commissionRate,
      platformCommission,
      driverEarnings,
      promoDetails
    };
  }

  /**
   * Calculate fare estimates for all vehicle categories at once
   */
  static estimateAllCategories(distanceKm, durationMinutes = 15, promoCode = null) {
    const categories = ['BIKE', 'AUTO', 'MINI', 'SEDAN', 'SUV'];
    return categories.map(cat => this.calculateFare(cat, distanceKm, durationMinutes, promoCode));
  }
}

