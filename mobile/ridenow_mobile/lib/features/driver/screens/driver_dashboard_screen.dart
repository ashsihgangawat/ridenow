import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/widgets/ridenow_logo.dart';
import '../../rider/models/ride_model.dart';
import '../providers/driver_dashboard_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../maps/widgets/ridenow_map_widget.dart';
import '../../maps/services/osrm_routing_service.dart';
import '../../chat/widgets/chat_sheet.dart';
import '../../chat/providers/chat_provider.dart';
import '../widgets/driver_online_toggle.dart';
import '../widgets/driver_earnings_card.dart';
import '../widgets/incoming_ride_request_sheet.dart';
import '../widgets/driver_active_ride_sheet.dart';

class DriverDashboardScreen extends ConsumerStatefulWidget {
  const DriverDashboardScreen({super.key});

  @override
  ConsumerState<DriverDashboardScreen> createState() =>
      _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends ConsumerState<DriverDashboardScreen> {
  final TextEditingController _otpCtrl = TextEditingController();
  final GlobalKey<RideNowMapWidgetState> _mapKey = GlobalKey<RideNowMapWidgetState>();
  List<LatLng>? _navigationRoute;
  String? _lastLoadedRideId;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(driverDashboardProvider.notifier).fetchProfile();
    });
  }

  @override
  void dispose() {
    _otpCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchNavigationRoute(RideModel ride) async {
    if (_lastLoadedRideId == ride.id && _navigationRoute != null) return;
    _lastLoadedRideId = ride.id;

    try {
      final routing = OsrmRoutingService();
      final target = (ride.status == 'REQUESTED' || ride.status == 'ACCEPTED')
          ? LatLng(ride.pickupLat, ride.pickupLng)
          : LatLng(ride.dropLat, ride.dropLng);
      final currentLoc = ref.read(driverDashboardProvider).currentDriverLocation;

      final details = await routing.getDrivingRoute(currentLoc, target);
      if (mounted && details.polylinePoints.isNotEmpty) {
        setState(() {
          _navigationRoute = details.polylinePoints;
        });
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _mapKey.currentState?.fitRoute();
        });
      }
    } catch (_) {}
  }

  Future<void> _handleSimulationToggle(RideModel ride, LatLng currentLoc) async {
    final driverNotifier = ref.read(driverDashboardProvider.notifier);
    final driverState = ref.read(driverDashboardProvider);

    if (driverState.isSimulating) {
      driverNotifier.stopRouteSimulation();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Driving simulation stopped.'),
          duration: Duration(seconds: 1),
        ),
      );
      return;
    }

    final target = (ride.status == 'REQUESTED' || ride.status == 'ACCEPTED')
        ? LatLng(ride.pickupLat, ride.pickupLng)
        : LatLng(ride.dropLat, ride.dropLng);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('🚗 Driving to target along the road... broadcasting to rider!'),
        backgroundColor: Color(0xFF10B981),
        duration: Duration(seconds: 2),
      ),
    );

    final routing = OsrmRoutingService();
    final details = await routing.getDrivingRoute(currentLoc, target);
    if (details.polylinePoints.isNotEmpty) {
      setState(() => _navigationRoute = details.polylinePoints);
      driverNotifier.startRouteSimulation(details.polylinePoints);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final driverState = ref.watch(driverDashboardProvider);
    final profile = driverState.driverProfile;
    final ride = driverState.currentRide;
    final incoming = driverState.incomingRequest;

    if (ride != null) {
      _fetchNavigationRoute(ride);
    } else if (_navigationRoute != null) {
      _navigationRoute = null;
      _lastLoadedRideId = null;
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 1. Full-Screen Interactive Driver Map
          RideNowMapWidget(
            key: _mapKey,
            driverPoint: driverState.currentDriverLocation,
            driverHeading: driverState.driverHeading,
            pickupPoint: ride != null ? LatLng(ride.pickupLat, ride.pickupLng) : null,
            destinationPoint: ride != null ? LatLng(ride.dropLat, ride.dropLng) : null,
            routePolyline: _navigationRoute,
            controlsBottomPadding: ride != null ? 320.0 : 120.0,
            onMapTap: (point) {
              ref.read(driverDashboardProvider.notifier).updateLocation(point);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    '📍 Vehicle location set to (${point.latitude.toStringAsFixed(4)}, ${point.longitude.toStringAsFixed(4)})',
                  ),
                  duration: const Duration(seconds: 1),
                  backgroundColor: const Color(0xFF10B981),
                ),
              );
            },
          ),

          // 2. Top Floating Navigation & Earnings Summary Header
          SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Brand Bar + Profile shortcuts
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4),
                  child: Row(
                    children: [
                      const RideNowLogo(height: 28, isDark: true),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F172A).withOpacity(0.9),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0x33FFC727)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Icon(Icons.drive_eta_rounded, color: Color(0xFFFFC727), size: 14),
                            SizedBox(width: 6),
                            Text(
                              'DRIVER PARTNER',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      // KYC / Verification icon
                      IconButton(
                        onPressed: () => context.push('/driver/verification'),
                        style: IconButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A).withOpacity(0.9),
                          foregroundColor: const Color(0xFFFFC727),
                        ),
                        icon: const Icon(Icons.verified_user_rounded, size: 20),
                        tooltip: 'Document Verification & KYC',
                      ),
                      const SizedBox(width: 6),
                      // Logout icon
                      IconButton(
                        onPressed: () async {
                          await ref.read(authProvider.notifier).logout();
                          if (context.mounted) context.go('/');
                        },
                        style: IconButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A).withOpacity(0.9),
                          foregroundColor: Colors.white70,
                        ),
                        icon: const Icon(Icons.logout_rounded, size: 18),
                        tooltip: 'Log out',
                      ),
                    ],
                  ),
                ),

                // Top Floating Earnings & Metrics Card
                DriverEarningsCard(
                  driverName: authState.user?.fullName ?? profile?['fullName'] ?? 'Driver Partner',
                  rating: (profile?['rating'] as num?)?.toDouble() ?? 5.0,
                  totalTrips: (profile?['totalTrips'] as num?)?.toInt() ?? 0,
                  walletBalance: (profile?['walletBalance'] as num?)?.toDouble() ?? 0.0,
                  onProfileTap: () => context.push('/driver/profile'),
                  onVerificationTap: () => context.push('/driver/verification'),
                ),
              ],
            ),
          ),

          // 3. INCOMING RIDE REQUEST POPUP
          if (incoming != null)
            Align(
              alignment: Alignment.center,
              child: IncomingRideRequestSheet(
                request: incoming,
                countdownSeconds: driverState.requestTimer,
                onAccept: () => ref.read(driverDashboardProvider.notifier).acceptRide(),
                onDecline: () => ref.read(driverDashboardProvider.notifier).declineRide(),
              ),
            ),

          // 4. BOTTOM ACTION CONTROL: ONLINE TOGGLE OR ACTIVE TRIP
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              top: false,
              bottom: true,
              child: ride != null
                  ? DriverActiveRideSheet(
                      ride: ride,
                      otpController: _otpCtrl,
                      isSimulating: driverState.isSimulating,
                      onChatTapped: () => ChatSheet.show(context, ride.id, 'RIDER'),
                      onSimulationToggled: () => _handleSimulationToggle(
                        ride,
                        driverState.currentDriverLocation,
                      ),
                      onMarkArrived: () => ref.read(driverDashboardProvider.notifier).markArrived(),
                      onStartTrip: () => ref.read(driverDashboardProvider.notifier).startRideWithOtp(
                            _otpCtrl.text.trim(),
                          ),
                      onCompleteTrip: () => ref.read(driverDashboardProvider.notifier).completeRide(),
                    )
                  : DriverOnlineToggle(
                      isOnline: driverState.isOnline,
                      isApproved: driverState.isApproved,
                      isLoading: driverState.isLoading,
                      verificationStatus: profile?['verificationStatus'],
                      onToggle: () => ref.read(driverDashboardProvider.notifier).toggleOnline(),
                      onVerifyTapped: () => context.push('/driver/verification'),
                    ),
            ),
          ),

          // 5. TRIP COMPLETED SETTLEMENT MODAL
          if (driverState.completedSettlement != null)
            _buildSettlementOverlay(driverState.completedSettlement!),
        ],
      ),
    );
  }

  Widget _buildSettlementOverlay(Map<String, dynamic> settlement) {
    return Container(
      color: Colors.black.withOpacity(0.85),
      child: Center(
        child: Container(
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: const Color(0xFFFFC727), width: 1.5),
            boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 20)],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.check_circle_rounded,
                color: Color(0xFF10B981),
                size: 54,
              ),
              const SizedBox(height: 12),
              const Text(
                'Trip Completed!',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                'Booking #${settlement['bookingCode']}',
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total Passenger Fare:',
                          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                        ),
                        Text(
                          '₹${settlement['totalFare']}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                    const Divider(color: Colors.white12, height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Net Credited to Wallet:',
                          style: TextStyle(
                            color: Color(0xFF10B981),
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '+₹${settlement['earnings']}',
                          style: const TextStyle(
                            color: Color(0xFF10B981),
                            fontWeight: FontWeight.w900,
                            fontSize: 18,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => ref.read(driverDashboardProvider.notifier).dismissSettlement(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFFC727),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('Ready for Next Dispatch', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
