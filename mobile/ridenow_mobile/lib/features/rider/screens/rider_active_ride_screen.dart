import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../app/theme/app_theme.dart';
import '../models/ride_model.dart';
import '../providers/rider_booking_provider.dart';
import '../../maps/services/osrm_routing_service.dart';
import '../../maps/widgets/openfree_map_widget.dart';
import '../../chat/widgets/chat_sheet.dart';
import '../../chat/providers/chat_provider.dart';

class RiderActiveRideScreen extends ConsumerStatefulWidget {
  final String rideId;

  const RiderActiveRideScreen({super.key, required this.rideId});

  @override
  ConsumerState<RiderActiveRideScreen> createState() =>
      _RiderActiveRideScreenState();
}

class _RiderActiveRideScreenState extends ConsumerState<RiderActiveRideScreen> {
  final GlobalKey<OpenFreeMapWidgetState> _mapKey =
      GlobalKey<OpenFreeMapWidgetState>();

  List<LatLng>? _activeRoute;
  RouteDetails? _routeDetails;
  bool _isFetchingRoute = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(riderBookingProvider.notifier).refreshRide(widget.rideId);
      ref.read(chatProvider.notifier).bindRide(widget.rideId);
    });
  }

  Future<void> _fetchDrivingRoute(RideModel ride) async {
    if (_isFetchingRoute) return;
    _isFetchingRoute = true;
    try {
      final routing = OsrmRoutingService();
      final details = await routing.getDrivingRoute(
        LatLng(ride.pickupLat, ride.pickupLng),
        LatLng(ride.dropLat, ride.dropLng),
      );
      if (mounted) {
        setState(() {
          _activeRoute = details.polylinePoints;
          _routeDetails = details;
          _isFetchingRoute = false;
        });
        // Fit full route after fetch
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _mapKey.currentState?.fitRoute();
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isFetchingRoute = false);
    }
  }

  Future<void> _callDriver(String? phone) async {
    if (phone == null || phone.isEmpty) return;
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _showRatingDialog() {
    int selectedRating = 5;
    final feedbackCtrl = TextEditingController(
      text: 'Smooth, safe ride and polite driver partner!',
    );

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.surfaceDark,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: const BorderSide(color: AppTheme.primaryYellow),
          ),
          title: const Text(
            'Rate Your RideNow Trip',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  return IconButton(
                    icon: Icon(
                      index < selectedRating
                          ? Icons.star_rounded
                          : Icons.star_border_rounded,
                      color: AppTheme.primaryYellow,
                      size: 32,
                    ),
                    onPressed: () =>
                        setDialogState(() => selectedRating = index + 1),
                  );
                }),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: feedbackCtrl,
                style: const TextStyle(color: Colors.white, fontSize: 12),
                decoration: const InputDecoration(
                  hintText: 'Share trip feedback...',
                ),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                ref
                    .read(riderBookingProvider.notifier)
                    .submitRating(
                      widget.rideId,
                      selectedRating,
                      feedbackCtrl.text,
                    );
                context.go('/rider/home');
              },
              child: const Text('Submit & Finish'),
            ),
          ],
        ),
      ),
    );
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'REQUESTED':
        return '🔍 Connecting to nearest driver...';
      case 'ACCEPTED':
        return '🚗 Driver accepted & arriving';
      case 'ARRIVED':
        return '📍 Driver arrived at pickup point';
      case 'IN_PROGRESS':
        return '🛣️ On the way to destination';
      case 'COMPLETED':
        return '✅ Trip Completed';
      case 'CANCELLED':
        return '❌ Ride Cancelled';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookingState = ref.watch(riderBookingProvider);
    final chatState = ref.watch(chatProvider);
    final ride = bookingState.currentRide;

    if (ride == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Ride Details')),
        body: const Center(
          child: CircularProgressIndicator(color: AppTheme.primaryYellow),
        ),
      );
    }

    // Trigger route fetch if route is not present
    if (_activeRoute == null) {
      if (bookingState.route?.polylinePoints != null &&
          bookingState.route!.polylinePoints.isNotEmpty) {
        _activeRoute = bookingState.route!.polylinePoints;
        _routeDetails = bookingState.route;
      } else {
        _fetchDrivingRoute(ride);
      }
    }

    if (ride.status == 'COMPLETED') {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (ride.paymentStatus != 'PAID' && ride.paymentStatus != 'PAID_CASH') {
          context.go('/rider/payment/${ride.id}');
        } else {
          _showRatingDialog();
        }
      });
    }

    final driver = ride.driver;
    final driverPhone = driver?['phone'] ?? '+919876543210';
    final distance = _routeDetails?.distanceKm ?? ride.distanceKm;
    final duration = _routeDetails?.durationMinutes.round() ?? ride.durationMinutes;

    return Scaffold(
      body: Stack(
        children: [
          // 1. Live Interactive Navigation Map
          OpenFreeMapWidget(
            key: _mapKey,
            pickupPoint: LatLng(ride.pickupLat, ride.pickupLng),
            destinationPoint: LatLng(ride.dropLat, ride.dropLng),
            driverPoint: bookingState.liveDriverLocation ??
                (driver != null && driver['currentLat'] != null
                    ? LatLng(driver['currentLat'], driver['currentLng'])
                    : null),
            driverHeading: bookingState.driverHeading,
            routePolyline: _activeRoute ?? bookingState.route?.polylinePoints,
            controlsBottomPadding: 330.0,
          ),

          // 2. Top Header Navigation Bar & Route Info Card
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 8),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Top Row: Back Button + Booking Code + Fit Route Button
                  Row(
                    children: [
                      IconButton(
                        onPressed: () => context.go('/rider/home'),
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.black.withOpacity(0.85),
                          foregroundColor: const Color(0xFFFFC727),
                        ),
                        icon: const Icon(Icons.arrow_back),
                      ),
                      const SizedBox(width: 8),

                      // Route Summary Pill
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.85),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0x44FFC727)),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.directions_car_rounded,
                                color: Color(0xFFFFC727),
                                size: 18,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  '$distance km • ~$duration min trip',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Fit Full Route Button
                      IconButton(
                        onPressed: () => _mapKey.currentState?.fitRoute(),
                        tooltip: 'View Full Route',
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.black.withOpacity(0.85),
                          foregroundColor: const Color(0xFF38BDF8),
                        ),
                        icon: const Icon(Icons.alt_route_rounded),
                      ),
                      const SizedBox(width: 4),

                      // Booking Code Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.85),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0x44FFC727)),
                        ),
                        child: Text(
                          '#${ride.bookingCode}',
                          style: const TextStyle(
                            color: Color(0xFFFFC727),
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.w900,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Route Address Banner (Pickup -> Drop)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.88),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0x33FFFFFF)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.4),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        // Pickup Row
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Color(0xFF10B981),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                ride.pickupAddress,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        // Drop Row
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Color(0xFFEF4444),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                ride.dropAddress,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 3. Bottom Active Ride Telemetry Card
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A).withOpacity(0.97),
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(28),
                ),
                border: const Border(
                  top: BorderSide(color: Color(0xFFFFC727), width: 1.5),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.8),
                    blurRadius: 25,
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Center drag pill
                  Center(
                    child: Container(
                      width: 36,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.grey[600],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),

                  // Status Banner
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 9,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFC727).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0x44FFC727)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            _getStatusLabel(ride.status),
                            style: const TextStyle(
                              color: Color(0xFFFFC727),
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        Text(
                          '₹${ride.totalFare} (${ride.paymentMethod})',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // 4-Digit Ride Start PIN Box
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [
                          Color(0xFFFFC727),
                          Color(0xFFF59E0B),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text(
                              'Ride Start PIN',
                              style: TextStyle(
                                color: Colors.black,
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            Text(
                              'Share with driver to start trip',
                              style: TextStyle(
                                color: Colors.black87,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            ride.otp,
                            style: const TextStyle(
                              color: Color(0xFFFFC727),
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'monospace',
                              letterSpacing: 2,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Driver Details Card & Actions
                  if (driver != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white12),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: const Color(0xFFFFC727),
                            foregroundColor: Colors.black,
                            radius: 22,
                            child: Text(
                              (driver['name'] ?? 'D')[0].toUpperCase(),
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  driver['name'] ?? 'Driver Partner',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.star,
                                      color: Color(0xFFFFC727),
                                      size: 14,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${driver['rating'] ?? 5.0} • Verified Partner',
                                      style: const TextStyle(
                                        color: Colors.grey,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                                if (driver['vehicle'] != null)
                                  Text(
                                    '${driver['vehicle']['make']} ${driver['vehicle']['model']} • ${driver['vehicle']['registrationNumber']}',
                                    style: const TextStyle(
                                      color: Color(0xFFFFC727),
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Communication Panel: Chat & Call Buttons
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () {
                              ChatSheet.show(context, ride.id, 'DRIVER');
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFFFC727),
                              foregroundColor: Colors.black,
                              padding: const EdgeInsets.symmetric(vertical: 13),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            icon: Badge(
                              isLabelVisible: chatState.unreadCount > 0,
                              label: Text('${chatState.unreadCount}'),
                              child: const Icon(
                                Icons.chat_bubble_outline,
                                size: 18,
                              ),
                            ),
                            label: const Text(
                              'Chat with Driver',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        IconButton(
                          onPressed: () => _callDriver(driverPhone),
                          style: IconButton.styleFrom(
                            backgroundColor: const Color(0xFF1E293B),
                            foregroundColor: const Color(0xFFFFC727),
                            padding: const EdgeInsets.all(14),
                            side: const BorderSide(
                              color: Color(0x33FFC727),
                            ),
                          ),
                          icon: const Icon(Icons.phone),
                          tooltip: 'Call Driver',
                        ),
                      ],
                    ),
                  ],

                  if (ride.status == 'COMPLETED') ...[
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => context.go('/rider/payment/${ride.id}'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFFC727),
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        icon: const Icon(Icons.payment_rounded),
                        label: Text(
                          'Proceed to Payment (₹${ride.totalFare.toInt()})',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                      ),
                    ),
                  ],
                  if (ride.status == 'REQUESTED') ...[
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: () async {
                        await ref
                            .read(riderBookingProvider.notifier)
                            .cancelRide(ride.id);
                        if (mounted) context.go('/rider/home');
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFFEF4444)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text(
                        'Cancel Ride',
                        style: TextStyle(
                          color: Color(0xFFEF4444),
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
