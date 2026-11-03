import 'package:flutter/foundation.dart';

/// Available payment methods for RideNow
enum PaymentMethod {
  cash,
  online,
}

extension PaymentMethodExtension on PaymentMethod {
  String get code {
    switch (this) {
      case PaymentMethod.cash:
        return 'CASH';
      case PaymentMethod.online:
        return 'ONLINE';
    }
  }

  String get displayName {
    switch (this) {
      case PaymentMethod.cash:
        return 'Cash to Driver';
      case PaymentMethod.online:
        return 'Online (UPI / Cards / Netbanking)';
    }
  }
}

/// Status of the payment flow
enum PaymentFlowStatus {
  idle,
  creatingOrder,
  awaitingRazorpay,
  verifying,
  success,
  failed,
  cancelled,
}

/// Order generated from the backend (Amount strictly in integer paise)
@immutable
class PaymentOrder {
  final String orderId;
  final int amountPaise;
  final String currency;
  final String keyId;
  final String rideId;
  final Map<String, dynamic> notes;

  const PaymentOrder({
    required this.orderId,
    required this.amountPaise,
    this.currency = 'INR',
    required this.keyId,
    required this.rideId,
    this.notes = const {},
  });

  /// Rupee representation helper (display purposes only)
  double get amountInRupees => amountPaise / 100.0;

  factory PaymentOrder.fromJson(Map<String, dynamic> json, {String? defaultRideId}) {
    return PaymentOrder(
      orderId: json['orderId'] ?? json['id'] ?? '',
      amountPaise: (json['amount'] as num?)?.toInt() ?? 0,
      currency: json['currency'] ?? 'INR',
      keyId: json['keyId'] ?? '',
      rideId: json['rideId'] ?? defaultRideId ?? '',
      notes: json['notes'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['notes'])
          : const {},
    );
  }
}

/// Itemized Fare Breakdown strictly in integer paise
@immutable
class FareBreakdown {
  final int baseFarePaise;
  final int distanceFarePaise;
  final int platformFeePaise;
  final int taxesPaise; // GST
  final int totalFarePaise;
  final double distanceKm;
  final double durationMinutes;
  final double surgeMultiplier;

  const FareBreakdown({
    required this.baseFarePaise,
    required this.distanceFarePaise,
    required this.platformFeePaise,
    required this.taxesPaise,
    required this.totalFarePaise,
    required this.distanceKm,
    required this.durationMinutes,
    this.surgeMultiplier = 1.0,
  });

  /// Factory calculating exact integer paise from ride metrics
  factory FareBreakdown.fromRide({
    required double totalFareRupees,
    required double distanceKm,
    required double durationMinutes,
    double surgeMultiplier = 1.0,
  }) {
    final totalPaise = (totalFareRupees * 100).round();
    // Platform fee: ₹5.00 flat = 500 paise (or min fraction)
    final platformFeePaise = (totalPaise > 1000) ? 500 : 200;
    // 5% GST in paise
    final taxesPaise = ((totalPaise * 5) ~/ 105);
    final remainingPaise = totalPaise - platformFeePaise - taxesPaise;
    final baseFarePaise = (remainingPaise * 0.35).round();
    final distanceFarePaise = remainingPaise - baseFarePaise;

    return FareBreakdown(
      baseFarePaise: baseFarePaise > 0 ? baseFarePaise : 2000,
      distanceFarePaise: distanceFarePaise > 0 ? distanceFarePaise : 3000,
      platformFeePaise: platformFeePaise,
      taxesPaise: taxesPaise > 0 ? taxesPaise : 250,
      totalFarePaise: totalPaise,
      distanceKm: distanceKm,
      durationMinutes: durationMinutes,
      surgeMultiplier: surgeMultiplier,
    );
  }

  static String formatPaise(int paise) {
    final double rupees = paise / 100.0;
    if (rupees == rupees.roundToDouble()) {
      return '₹${rupees.toInt()}';
    }
    return '₹${rupees.toStringAsFixed(2)}';
  }

  String get formattedTotal => formatPaise(totalFarePaise);
  String get formattedBaseFare => formatPaise(baseFarePaise);
  String get formattedDistanceFare => formatPaise(distanceFarePaise);
  String get formattedPlatformFee => formatPaise(platformFeePaise);
  String get formattedTaxes => formatPaise(taxesPaise);
}

/// Payment verification payload sent to backend
@immutable
class PaymentVerificationPayload {
  final String rideId;
  final String razorpayPaymentId;
  final String razorpayOrderId;
  final String razorpaySignature;

  const PaymentVerificationPayload({
    required this.rideId,
    required this.razorpayPaymentId,
    required this.razorpayOrderId,
    required this.razorpaySignature,
  });

  Map<String, dynamic> toJson() => {
        'rideId': rideId,
        'razorpayPaymentId': razorpayPaymentId,
        'razorpayOrderId': razorpayOrderId,
        'razorpaySignature': razorpaySignature,
      };
}

/// Result / Receipt after payment completes
@immutable
class PaymentReceipt {
  final String paymentId;
  final String? orderId;
  final String rideId;
  final int amountPaise;
  final PaymentMethod paymentMethod;
  final String status;
  final DateTime timestamp;
  final String message;

  const PaymentReceipt({
    required this.paymentId,
    this.orderId,
    required this.rideId,
    required this.amountPaise,
    required this.paymentMethod,
    required this.status,
    required this.timestamp,
    required this.message,
  });

  String get formattedAmount => FareBreakdown.formatPaise(amountPaise);
}

