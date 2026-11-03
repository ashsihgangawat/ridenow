import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/widgets/ridenow_logo.dart';
import '../../auth/providers/auth_provider.dart';
import '../../rider/models/ride_model.dart';
import '../../rider/providers/rider_booking_provider.dart';
import '../models/payment_model.dart';
import '../providers/payment_provider.dart';

class PaymentScreen extends ConsumerStatefulWidget {
  final String rideId;

  const PaymentScreen({super.key, required this.rideId});

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen>
    with WidgetsBindingObserver {
  late Razorpay _razorpay;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Initialize Razorpay instance
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _initialized = true;
      _setupPaymentContext();
    }
  }

  void _setupPaymentContext() {
    final bookingState = ref.read(riderBookingProvider);
    final ride = bookingState.currentRide;

    if (ride != null) {
      ref.read(paymentProvider.notifier).initRide(ride);
    } else {
      // In case user navigated directly with rideId, fetch or populate safe placeholder
      final placeholderRide = RideModel(
        id: widget.rideId,
        bookingCode: 'RN-${widget.rideId.substring(0, widget.rideId.length > 4 ? 4 : widget.rideId.length).toUpperCase()}',
        customerId: '',
        vehicleCategory: 'BIKE',
        pickupAddress: 'Pickup Point',
        pickupLat: 22.7196,
        pickupLng: 75.8577,
        dropAddress: 'Drop Destination',
        dropLat: 22.7533,
        dropLng: 75.8937,
        distanceKm: 4.2,
        durationMinutes: 12.0,
        totalFare: 85.0,
        status: 'COMPLETED',
        otp: '1234',
        paymentMethod: 'ONLINE',
        paymentStatus: 'PENDING',
        createdAt: DateTime.now(),
      );
      ref.read(paymentProvider.notifier).initRide(placeholderRide);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _razorpay.clear();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // When returning to app after external UPI apps (Google Pay, PhonePe, Paytm)
    if (state == AppLifecycleState.resumed) {
      debugPrint('[PaymentScreen] Resumed from payment gateway lifecycle.');
    }
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    ref.read(paymentProvider.notifier).onRazorpaySuccess(response);
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    ref.read(paymentProvider.notifier).onRazorpayError(response);
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ref.read(paymentProvider.notifier).onExternalWallet(response);
  }

  void _onPayPressed(RideModel? ride) {
    final auth = ref.read(authProvider);
    final userPhone = auth.user?.phone ?? '+919876543210';
    final userEmail = auth.user?.email ?? 'rider@ridenow.in';
    final bookingCode = ride?.bookingCode ?? 'RN-TRIP';

    ref.read(paymentProvider.notifier).executePayment(
      razorpay: _razorpay,
      bookingCode: bookingCode,
      userPhone: userPhone,
      userEmail: userEmail,
    );
  }

  @override
  Widget build(BuildContext context) {
    final paymentState = ref.watch(paymentProvider);
    final bookingState = ref.watch(riderBookingProvider);
    final ride = bookingState.currentRide;
    final fare = paymentState.fare;

    return PopScope(
      canPop: !paymentState.isProcessing,
      child: Scaffold(
        backgroundColor: AppTheme.backgroundBlack,
        appBar: AppBar(
          backgroundColor: AppTheme.surfaceDark,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
            onPressed: paymentState.isProcessing ? null : () => context.go('/rider/home'),
          ),
          centerTitle: true,
          title: const RideNowLogo(height: 28),
          actions: [
            Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white24),
              ),
              child: Text(
                '#${ride?.bookingCode ?? 'TRIP'}',
                style: const TextStyle(
                  color: AppTheme.primaryYellow,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ],
        ),
        body: SafeArea(
          child: Stack(
            children: [
              // Main scrollable content
              SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // 1. Trip Route & Vehicle Summary Card
                    _buildTripCard(ride),
                    const SizedBox(height: 16),

                    // 2. Itemized Fare Breakdown Card
                    if (fare != null) _buildFareCard(fare),
                    const SizedBox(height: 20),

                    // 3. Payment Method Selector
                    _buildMethodSelector(paymentState),
                    const SizedBox(height: 16),

                    // 4. Alert & Error Banner
                    if (paymentState.flowStatus == PaymentFlowStatus.cancelled)
                      _buildCancelledBanner(),
                    if (paymentState.flowStatus == PaymentFlowStatus.failed &&
                        paymentState.errorMessage != null)
                      _buildErrorBanner(paymentState.errorMessage!),

                    // 5. Razorpay Test Mode Badge
                    _buildTestModeBadge(),
                  ],
                ),
              ),

              // Bottom Sticky "Pay Now" action bar
              Align(
                alignment: Alignment.bottomCenter,
                child: _buildBottomPayBar(paymentState, ride),
              ),

              // Full Screen Payment Success Overlay
              if (paymentState.flowStatus == PaymentFlowStatus.success &&
                  paymentState.receipt != null)
                _buildSuccessOverlay(paymentState.receipt!),
            ],
          ),
        ),
      ),
    );
  }

  /// 1. Trip Card
  Widget _buildTripCard(RideModel? ride) {
    final isBike = (ride?.vehicleCategory ?? 'BIKE').toUpperCase().contains('BIKE');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceDark,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.primaryYellow.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isBike ? Icons.two_wheeler_rounded : Icons.directions_car_rounded,
                  color: AppTheme.primaryYellow,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isBike ? 'RideNow Bike Taxi' : 'RideNow Car Taxi',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${ride?.distanceKm.toStringAsFixed(1) ?? '3.5'} km • Trip Completed',
                      style: const TextStyle(
                        color: Colors.white60,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.green.withOpacity(0.4)),
                ),
                child: const Text(
                  'COMPLETED',
                  style: TextStyle(
                    color: Colors.greenAccent,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(color: Colors.white10, height: 1),
          ),
          // Route Details
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  const Icon(Icons.circle, color: Colors.greenAccent, size: 10),
                  Container(
                    width: 2,
                    height: 24,
                    color: Colors.white24,
                    margin: const EdgeInsets.symmetric(vertical: 2),
                  ),
                  const Icon(Icons.location_on, color: AppTheme.primaryYellow, size: 12),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ride?.pickupAddress ?? 'Pickup Point',
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      ride?.dropAddress ?? 'Destination Drop',
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// 2. Itemized Fare Breakdown Card
  Widget _buildFareCard(FareBreakdown fare) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceDark,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Fare Breakdown',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 14),
          _buildFareRow('Base Fare', fare.formattedBaseFare),
          const SizedBox(height: 8),
          _buildFareRow(
            'Distance Fare (${fare.distanceKm.toStringAsFixed(1)} km)',
            fare.formattedDistanceFare,
          ),
          const SizedBox(height: 8),
          _buildFareRow('Platform Fee', fare.formattedPlatformFee),
          const SizedBox(height: 8),
          _buildFareRow('Government Taxes & GST (5%)', fare.formattedTaxes),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(color: Colors.white24, height: 1),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total Payable Fare',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                fare.formattedTotal,
                style: const TextStyle(
                  color: AppTheme.primaryYellow,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFareRow(String title, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: const TextStyle(color: Colors.white60, fontSize: 13)),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
      ],
    );
  }

  /// 3. Payment Method Selector
  Widget _buildMethodSelector(PaymentState state) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Select Payment Method',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),

        // Option 1: Online (UPI / Razorpay)
        _buildPaymentOptionTile(
          icon: Icons.account_balance_wallet_rounded,
          iconColor: const Color(0xFF38BDF8),
          title: 'UPI / Cards / Netbanking',
          subtitle: 'Google Pay, PhonePe, Paytm, Cards & Netbanking',
          badgeText: 'Instant & Secure',
          badgeColor: Colors.blueAccent,
          isSelected: state.selectedMethod == PaymentMethod.online,
          onTap: () => ref.read(paymentProvider.notifier).selectMethod(PaymentMethod.online),
        ),
        const SizedBox(height: 10),

        // Option 2: Cash
        _buildPaymentOptionTile(
          icon: Icons.payments_rounded,
          iconColor: Colors.greenAccent,
          title: 'Cash to Driver',
          subtitle: 'Pay exact cash directly to driver partner upon completion',
          badgeText: 'Pay on Drop',
          badgeColor: Colors.green,
          isSelected: state.selectedMethod == PaymentMethod.cash,
          onTap: () => ref.read(paymentProvider.notifier).selectMethod(PaymentMethod.cash),
        ),
      ],
    );
  }

  Widget _buildPaymentOptionTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required String badgeText,
    required Color badgeColor,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF222222) : AppTheme.surfaceDark,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppTheme.primaryYellow : Colors.white12,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppTheme.primaryYellow.withOpacity(0.12),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ]
              : null,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: badgeColor.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          badgeText,
                          style: TextStyle(
                            color: badgeColor,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: const TextStyle(color: Colors.white54, fontSize: 11),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSelected ? AppTheme.primaryYellow : Colors.white24,
            ),
          ],
        ),
      ),
    );
  }

  /// Cancelled Banner
  Widget _buildCancelledBanner() {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.withOpacity(0.4)),
      ),
      child: const Row(
        children: [
          Icon(Icons.info_outline_rounded, color: Colors.orangeAccent, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Payment was cancelled. You may switch to Cash or retry Razorpay checkout.',
              style: TextStyle(color: Colors.orangeAccent, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  /// Error Banner
  Widget _buildErrorBanner(String message) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.withOpacity(0.4)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: Colors.redAccent, fontSize: 12),
            ),
          ),
          TextButton(
            onPressed: () => ref.read(paymentProvider.notifier).reset(),
            child: const Text('RETRY', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
          ),
        ],
      ),
    );
  }

  /// Razorpay Test Mode Badge
  Widget _buildTestModeBadge() {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white10),
      ),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shield_outlined, color: Colors.white54, size: 14),
          const SizedBox(width: 6),
          Text(
            'Secured by Razorpay • TEST MODE Active',
            style: TextStyle(color: Colors.white54, fontSize: 11, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  /// Bottom Sticky Payment Action Bar
  Widget _buildBottomPayBar(PaymentState state, RideModel? ride) {
    final fare = state.fare;
    final isOnline = state.selectedMethod == PaymentMethod.online;

    String statusText = 'Pay Now';
    if (state.flowStatus == PaymentFlowStatus.creatingOrder) {
      statusText = 'Creating Razorpay Order...';
    } else if (state.flowStatus == PaymentFlowStatus.awaitingRazorpay) {
      statusText = 'Opening Payment Gateway...';
    } else if (state.flowStatus == PaymentFlowStatus.verifying) {
      statusText = 'Verifying Transaction...';
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceDark,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.5),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
        border: const Border(
          top: BorderSide(color: Colors.white12),
        ),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            // Prevent double taps when processing
            onPressed: state.isProcessing ? null : () => _onPayPressed(ride),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryYellow,
              foregroundColor: Colors.black,
              disabledBackgroundColor: AppTheme.primaryYellow.withOpacity(0.5),
              disabledForegroundColor: Colors.black54,
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: state.isProcessing
                ? Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        statusText,
                        style: const TextStyle(
                          color: Colors.black,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                    ],
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isOnline ? 'Pay via Razorpay' : 'Confirm Cash Payment',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.2,
                        ),
                      ),
                      Row(
                        children: [
                          Text(
                            fare?.formattedTotal ?? '₹85',
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.arrow_forward_rounded, size: 18),
                        ],
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  /// Full Screen Payment Success Overlay
  Widget _buildSuccessOverlay(PaymentReceipt receipt) {
    return Container(
      color: AppTheme.backgroundBlack.withOpacity(0.97),
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Success Icon with Glow
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.green.withOpacity(0.18),
                border: Border.all(color: Colors.greenAccent, width: 2),
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                color: Colors.greenAccent,
                size: 58,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Payment Successful!',
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              receipt.message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 24),

            // Receipt Box
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.surfaceDark,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white12),
              ),
              child: Column(
                children: [
                  _buildReceiptRow('Amount Paid', receipt.formattedAmount, isBold: true, color: AppTheme.primaryYellow),
                  const SizedBox(height: 10),
                  _buildReceiptRow('Method', receipt.paymentMethod.displayName),
                  const SizedBox(height: 10),
                  _buildReceiptRow('Reference ID', receipt.paymentId),
                  const SizedBox(height: 10),
                  _buildReceiptRow(
                    'Time',
                    '${receipt.timestamp.hour.toString().padLeft(2, '0')}:${receipt.timestamp.minute.toString().padLeft(2, '0')} IST',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Done & Return Home Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () {
                  ref.read(riderBookingProvider.notifier).resetBooking();
                  context.go('/rider/home');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryYellow,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text(
                  'Finish & Return Home',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReceiptRow(String label, String value, {bool isBold = false, Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.white54, fontSize: 12)),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              color: color ?? Colors.white,
              fontSize: 12,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

