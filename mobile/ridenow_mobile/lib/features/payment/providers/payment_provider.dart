import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../../app/config/environment.dart';
import '../../auth/providers/auth_provider.dart';
import '../../rider/models/ride_model.dart';
import '../models/payment_model.dart';
import '../services/payment_service.dart';

class PaymentState {
  final PaymentFlowStatus flowStatus;
  final PaymentMethod selectedMethod;
  final FareBreakdown? fare;
  final PaymentOrder? order;
  final PaymentReceipt? receipt;
  final String? errorMessage;
  final bool isProcessing;
  final String? rideId;

  const PaymentState({
    this.flowStatus = PaymentFlowStatus.idle,
    this.selectedMethod = PaymentMethod.online,
    this.fare,
    this.order,
    this.receipt,
    this.errorMessage,
    this.isProcessing = false,
    this.rideId,
  });

  PaymentState copyWith({
    PaymentFlowStatus? flowStatus,
    PaymentMethod? selectedMethod,
    FareBreakdown? fare,
    PaymentOrder? order,
    PaymentReceipt? receipt,
    String? errorMessage,
    bool? isProcessing,
    String? rideId,
  }) {
    return PaymentState(
      flowStatus: flowStatus ?? this.flowStatus,
      selectedMethod: selectedMethod ?? this.selectedMethod,
      fare: fare ?? this.fare,
      order: order ?? this.order,
      receipt: receipt ?? this.receipt,
      errorMessage: errorMessage,
      isProcessing: isProcessing ?? this.isProcessing,
      rideId: rideId ?? this.rideId,
    );
  }
}

class PaymentNotifier extends StateNotifier<PaymentState> {
  final PaymentService _service;

  PaymentNotifier(this._service) : super(const PaymentState());

  /// Initialize fare calculation from Ride
  void initRide(RideModel ride) {
    final fare = FareBreakdown.fromRide(
      totalFareRupees: ride.totalFare,
      distanceKm: ride.distanceKm,
      durationMinutes: ride.durationMinutes,
    );

    state = state.copyWith(
      flowStatus: PaymentFlowStatus.idle,
      selectedMethod: ride.paymentMethod == 'CASH'
          ? PaymentMethod.cash
          : PaymentMethod.online,
      fare: fare,
      rideId: ride.id,
      errorMessage: null,
      isProcessing: false,
    );
  }

  /// Change Payment Method
  void selectMethod(PaymentMethod method) {
    if (state.isProcessing) return; // Prevent change mid-transaction
    state = state.copyWith(selectedMethod: method, errorMessage: null);
  }

  /// Reset state for retry
  void reset() {
    state = state.copyWith(
      flowStatus: PaymentFlowStatus.idle,
      errorMessage: null,
      isProcessing: false,
    );
  }

  /// Execute selected payment method
  Future<void> executePayment({
    required Razorpay razorpay,
    required String bookingCode,
    String userPhone = '+919876543210',
    String userEmail = 'rider@ridenow.in',
  }) async {
    // 1. Double-tap guard
    if (state.isProcessing) return;
    if (state.fare == null || state.rideId == null) {
      state = state.copyWith(
        flowStatus: PaymentFlowStatus.failed,
        errorMessage: 'Invalid ride information for settlement',
      );
      return;
    }

    final rideId = state.rideId!;
    final totalPaise = state.fare!.totalFarePaise;

    // 2. CASH Payment Route
    if (state.selectedMethod == PaymentMethod.cash) {
      state = state.copyWith(
        isProcessing: true,
        flowStatus: PaymentFlowStatus.verifying,
        errorMessage: null,
      );

      try {
        final receipt = await _service.confirmCashPayment(
          rideId: rideId,
          amountPaise: totalPaise,
        );
        state = state.copyWith(
          isProcessing: false,
          flowStatus: PaymentFlowStatus.success,
          receipt: receipt,
        );
      } catch (err) {
        state = state.copyWith(
          isProcessing: false,
          flowStatus: PaymentFlowStatus.failed,
          errorMessage: err.toString(),
        );
      }
      return;
    }

    // 3. ONLINE (Razorpay) Payment Route
    state = state.copyWith(
      isProcessing: true,
      flowStatus: PaymentFlowStatus.creatingOrder,
      errorMessage: null,
    );

    try {
      // Step A: Backend Order Creation (Paise integer handling)
      final order = await _service.createOrder(
        rideId: rideId,
        amountPaise: totalPaise,
        notes: {'bookingCode': bookingCode},
      );

      state = state.copyWith(
        order: order,
        flowStatus: PaymentFlowStatus.awaitingRazorpay,
      );

      // Step B: Razorpay Checkout Options
      // Key ID from backend order or config fallback
      final razorpayKey = order.keyId.isNotEmpty
          ? order.keyId
          : EnvironmentConfig.razorpayKeyId;

      final options = {
        'key': razorpayKey,
        'amount': order.amountPaise, // In paise
        'name': 'RideNow Mobility',
        'order_id': order.orderId,
        'description': 'Fare for Ride #$bookingCode',
        'timeout': 180, // 3 minutes timeout
        'prefill': {
          'contact': userPhone,
          'email': userEmail,
        },
        'theme': {
          'color': '#FFC928', // RideNow Primary Yellow
        },
        'notes': {
          'rideId': rideId,
          'bookingCode': bookingCode,
        },
      };

      razorpay.open(options);
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        flowStatus: PaymentFlowStatus.failed,
        errorMessage: 'Unable to initialize Razorpay: $e',
      );
    }
  }

  /// Razorpay Success Callback
  Future<void> onRazorpaySuccess(PaymentSuccessResponse response) async {
    state = state.copyWith(
      flowStatus: PaymentFlowStatus.verifying,
      isProcessing: true,
      errorMessage: null,
    );

    try {
      final rideId = state.rideId ?? '';
      final paymentId = response.paymentId ?? '';
      final orderId = response.orderId ?? state.order?.orderId ?? '';
      final signature = response.signature ?? '';

      // Cryptographic verification via Backend
      final receipt = await _service.verifyPayment(
        rideId: rideId,
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        razorpaySignature: signature,
        amountPaise: state.fare?.totalFarePaise ?? 0,
      );

      state = state.copyWith(
        flowStatus: PaymentFlowStatus.success,
        receipt: receipt,
        isProcessing: false,
      );
    } catch (err) {
      state = state.copyWith(
        flowStatus: PaymentFlowStatus.failed,
        errorMessage: 'Verification failed: $err',
        isProcessing: false,
      );
    }
  }

  /// Razorpay Failure Callback
  void onRazorpayError(PaymentFailureResponse response) {
    final code = response.code ?? 0;
    final message = response.message ?? 'Transaction incomplete';

    // Check if user actively dismissed/cancelled the checkout
    if (code == Razorpay.PAYMENT_CANCELLED ||
        message.toLowerCase().contains('cancel')) {
      state = state.copyWith(
        flowStatus: PaymentFlowStatus.cancelled,
        errorMessage: 'Payment cancelled by user',
        isProcessing: false,
      );
    } else {
      state = state.copyWith(
        flowStatus: PaymentFlowStatus.failed,
        errorMessage: message,
        isProcessing: false,
      );
    }
  }

  /// External Wallet Callback (Paytm, Mobikwik, etc.)
  void onExternalWallet(ExternalWalletResponse response) {
    debugPrint('[PaymentProvider] External Wallet Selected: ${response.walletName}');
  }
}

// Dependency Injection Providers
final paymentServiceProvider = Provider<PaymentService>((ref) {
  final api = ref.watch(apiClientProvider);
  return PaymentService(api);
});

final paymentProvider =
    StateNotifierProvider.autoDispose<PaymentNotifier, PaymentState>((ref) {
  final service = ref.watch(paymentServiceProvider);
  return PaymentNotifier(service);
});

