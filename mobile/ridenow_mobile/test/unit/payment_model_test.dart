import 'package:flutter_test/flutter_test.dart';
import 'package:ridenow_mobile/features/payment/models/payment_model.dart';

void main() {
  group('Payment Module - FareBreakdown & Money Math', () {
    test('Calculates exact integer paise without floating point inaccuracy', () {
      final fare = FareBreakdown.fromRide(
        totalFareRupees: 85.0,
        distanceKm: 4.2,
        durationMinutes: 12.0,
      );

      // Total must be 8500 paise
      expect(fare.totalFarePaise, 8500);
      expect(fare.formattedTotal, '₹85');

      // Platform fee is 500 paise (₹5)
      expect(fare.platformFeePaise, 500);
      expect(fare.formattedPlatformFee, '₹5');

      // Taxes GST (5% of 8500 ~/ 105) = 404 paise (~₹4.04)
      expect(fare.taxesPaise, greaterThan(0));

      // Sum of components matches total
      final sumComponents =
          fare.baseFarePaise + fare.distanceFarePaise + fare.platformFeePaise + fare.taxesPaise;
      expect(sumComponents, fare.totalFarePaise);
    });

    test('PaymentOrder serialization with integer paise', () {
      final orderJson = {
        'id': 'order_test_9921',
        'amount': 15000, // 15000 paise = ₹150.00
        'currency': 'INR',
        'keyId': 'rzp_test_placeholder_key',
        'notes': {'bookingCode': 'RN-4412'},
      };

      final order = PaymentOrder.fromJson(orderJson, defaultRideId: 'ride_123');

      expect(order.orderId, 'order_test_9921');
      expect(order.amountPaise, 15000);
      expect(order.amountInRupees, 150.0);
      expect(order.currency, 'INR');
      expect(order.keyId, 'rzp_test_placeholder_key');
      expect(order.rideId, 'ride_123');
      expect(order.notes['bookingCode'], 'RN-4412');
    });

    test('PaymentVerificationPayload serialization', () {
      const payload = PaymentVerificationPayload(
        rideId: 'ride_abc',
        razorpayPaymentId: 'pay_xyz123',
        razorpayOrderId: 'order_uvw456',
        razorpaySignature: 'sig_hmac789',
      );

      final json = payload.toJson();
      expect(json['rideId'], 'ride_abc');
      expect(json['razorpayPaymentId'], 'pay_xyz123');
      expect(json['razorpayOrderId'], 'order_uvw456');
      expect(json['razorpaySignature'], 'sig_hmac789');
    });

    test('PaymentMethod codes and display names', () {
      expect(PaymentMethod.cash.code, 'CASH');
      expect(PaymentMethod.online.code, 'ONLINE');
      expect(PaymentMethod.cash.displayName, 'Cash to Driver');
      expect(PaymentMethod.online.displayName, 'Online (UPI / Cards / Netbanking)');
    });
  });
}

