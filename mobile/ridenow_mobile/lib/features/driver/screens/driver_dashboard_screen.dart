import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/widgets/ridenow_logo.dart';
import '../../rider/models/ride_model.dart';
import '../providers/driver_dashboard_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../maps/widgets/openfree_map_widget.dart';
import '../../maps/services/osrm_routing_service.dart';
import '../../chat/widgets/chat_sheet.dart';
import '../../chat/providers/chat_provider.dart';

class DriverDashboardScreen extends ConsumerStatefulWidget {
  const DriverDashboardScreen({super.key});

  @override
  ConsumerState<DriverDashboardScreen> createState() =>
      _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends ConsumerState<DriverDashboardScreen> {
  final TextEditingController _otpCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(driverDashboardProvider.notifier).fetchProfile();
    });
  }

  Future<void> _handleSimulationToggle(RideModel ride, LatLng currentLoc) async {
    final driverNotifier = ref.read(driverDashboardProvider.notifier);
    final driverState = ref.read(driverDashboardProvider);

    if (driverState.isSimulating) {
      driverNotifier.stopRouteSimulation();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Driving simulation paused.'),
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
      driverNotifier.startRouteSimulation(details.polylinePoints);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final driverState = ref.watch(driverDashboardProvider);
    final chatState = ref.watch(chatProvider);
    final profile = driverState.driverProfile;
    final ride = driverState.currentRide;
    final incoming = driverState.incomingRequest;

    return Scaffold(
      body: Stack(
        children: [
          // 1. OpenFreeMap Background View with Interactive Location Tap
          OpenFreeMapWidget(
            driverPoint: driverState.currentDriverLocation,
            driverHeading: driverState.driverHeading,
            pickupPoint: ride != null
                ? LatLng(ride.pickupLat, ride.pickupLng)
                : null,
            destinationPoint: ride != null
                ? LatLng(ride.dropLat, ride.dropLng)
                : null,
            controlsBottomPadding: ride != null ? 310.0 : 90.0,
            onMapTap: (point) {
              ref.read(driverDashboardProvider.notifier).updateLocation(point);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    '📍 Live location updated to (${point.latitude.toStringAsFixed(4)}, ${point.longitude.toStringAsFixed(4)})',
                  ),
                  duration: const Duration(seconds: 1),
                  backgroundColor: const Color(0xFF10B981),
                ),
              );
            },
          ),

          // 2. Top Driver Partner Navigation & Status Header
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 16.0,
                vertical: 8,
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const RideNowLogo(height: 28, isDark: true),
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: () => context.push('/driver/profile'),
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceDark.withOpacity(0.95),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppTheme.borderSubtle),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.local_taxi,
                                color: AppTheme.primaryYellow,
                                size: 16,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                authState.user?.fullName ?? 'Driver Partner',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(
                                Icons.chevron_right,
                                color: Colors.white54,
                                size: 16,
                              ),
                            ],
                          ),
                        ),
                      ),
                      const Spacer(),
                      // Profile Button
                      IconButton(
                        onPressed: () => context.push('/driver/profile'),
                        style: IconButton.styleFrom(
                          backgroundColor: AppTheme.surfaceDark.withOpacity(
                            0.95,
                          ),
                          foregroundColor: Colors.white,
                        ),
                        icon: const Icon(Icons.person, size: 20),
                        tooltip: 'Driver Profile & Earnings',
                      ),
                      const SizedBox(width: 6),
                      // KYC / Verification Button
                      IconButton(
                        onPressed: () => context.push('/driver/verification'),
                        style: IconButton.styleFrom(
                          backgroundColor: AppTheme.surfaceDark.withOpacity(
                            0.95,
                          ),
                          foregroundColor: AppTheme.primaryYellow,
                        ),
                        icon: const Icon(Icons.verified_user, size: 20),
                        tooltip: 'Document Verification & KYC',
                      ),
                      const SizedBox(width: 6),
                      // Logout
                      IconButton(
                        onPressed: () async {
                          await ref.read(authProvider.notifier).logout();
                          if (context.mounted) context.go('/');
                        },
                        style: IconButton.styleFrom(
                          backgroundColor: AppTheme.surfaceDark.withOpacity(
                            0.95,
                          ),
                          foregroundColor: Colors.white70,
                        ),
                        icon: const Icon(Icons.logout, size: 18),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Metrics Bar (Rating, Trips, Wallet, Status)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceDark.withOpacity(0.95),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppTheme.borderSubtle),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _metricItem(
                          '★ ${profile?['rating'] ?? 5.0}',
                          'Rating',
                          AppTheme.primaryYellow,
                        ),
                        _metricItem(
                          '${profile?['totalTrips'] ?? 0}',
                          'Trips',
                          Colors.white,
                        ),
                        _metricItem(
                          '₹${profile?['walletBalance'] ?? 0}',
                          'Wallet',
                          AppTheme.successGreen,
                        ),
                        InkWell(
                          onTap: () => context.push('/driver/verification'),
                          child: _metricItem(
                            driverState.driverProfile?['verificationStatus'] ?? (driverState.isApproved ? 'APPROVED' : 'PENDING'),
                            'KYC Status',
                            driverState.isApproved
                                ? AppTheme.successGreen
                                : Colors.amber,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.85),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0x33FFC727)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.touch_app_rounded, color: Color(0xFFFFC727), size: 14),
                        SizedBox(width: 6),
                        Text(
                          'Tap anywhere on map to set your live vehicle location',
                          style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 3. INCOMING RIDE REQUEST POPUP
          if (incoming != null)
            Align(
              alignment: Alignment.center,
              child: Container(
                margin: const EdgeInsets.all(24),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceDark,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: AppTheme.primaryYellow, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primaryYellow.withOpacity(0.4),
                      blurRadius: 30,
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryYellow.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Text(
                            'NEW DISPATCH REQUEST',
                            style: TextStyle(
                              color: AppTheme.primaryYellow,
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        Text(
                          '⏱️ ${driverState.requestTimer}s',
                          style: const TextStyle(
                            color: AppTheme.primaryYellow,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      '₹${incoming['driverEarnings'] ?? incoming['totalFare'] ?? 75.0}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const Text(
                      'Estimated Partner Earnings (After 15% Platform cut)',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'Pickup: ${incoming['pickupAddress']}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Drop: ${incoming['dropAddress']}',
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => ref
                                .read(driverDashboardProvider.notifier)
                                .declineRide(),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Colors.white24),
                            ),
                            child: const Text(
                              'Decline',
                              style: TextStyle(color: Colors.white70),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => ref
                                .read(driverDashboardProvider.notifier)
                                .acceptRide(),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.successGreen,
                            ),
                            child: const Text('Accept Ride'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

          // 4. BOTTOM ACTION CONTROL: ONLINE TOGGLE OR ACTIVE TRIP
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.surfaceDark.withOpacity(0.98),
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(28),
                ),
                border: const Border(
                  top: BorderSide(color: AppTheme.primaryYellow, width: 1.5),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.8),
                    blurRadius: 25,
                  ),
                ],
              ),
              child: ride != null
                  ? _buildActiveTripPanel(ride, chatState)
                  : _buildOnlineTogglePanel(driverState),
            ),
          ),

          // 5. TRIP COMPLETED SETTLEMENT MODAL
          if (driverState.completedSettlement != null)
            _buildSettlementOverlay(driverState.completedSettlement!),
        ],
      ),
    );
  }

  Widget _metricItem(String value, String label, Color valColor) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            color: valColor,
            fontWeight: FontWeight.w900,
            fontSize: 14,
          ),
        ),
        Text(
          label,
          style: const TextStyle(color: AppTheme.textMuted, fontSize: 10),
        ),
      ],
    );
  }

  Widget _buildOnlineTogglePanel(DriverDashboardState state) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (state.error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Text(
              state.error!,
              style: const TextStyle(color: AppTheme.errorRed, fontSize: 11),
              textAlign: TextAlign.center,
            ),
          ),

        if (!state.isApproved) ...[
          InkWell(
            onTap: () => context.push('/driver/verification'),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFCA5A5)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.shield_outlined,
                      color: Color(0xFFDC2626), size: 24),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Status: ${state.driverProfile?['verificationStatus'] ?? 'PENDING'}',
                          style: const TextStyle(
                            color: Color(0xFF991B1B),
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Tap to verify documents & get approved to drive.',
                          style: TextStyle(
                              color: Color(0xFFB91C1C), fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: Color(0xFF991B1B)),
                ],
              ),
            ),
          ),
        ],

        ElevatedButton.icon(
          onPressed: !state.isApproved || state.isLoading
              ? () {
                  context.push('/driver/verification');
                }
              : () => ref.read(driverDashboardProvider.notifier).toggleOnline(),
          style: ElevatedButton.styleFrom(
            backgroundColor: !state.isApproved
                ? Colors.grey[800]
                : state.isOnline
                    ? AppTheme.successGreen
                    : AppTheme.primaryYellow,
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
          icon: Icon(
            !state.isApproved ? Icons.lock_outline : Icons.power_settings_new,
            color: !state.isApproved ? Colors.white54 : Colors.black,
          ),
          label: Text(
            !state.isApproved
                ? 'VERIFICATION REQUIRED TO GO ONLINE'
                : state.isOnline
                    ? 'ONLINE • ACCEPTING TRIPS'
                    : 'GO ONLINE TO RECEIVE TRIPS',
            style: TextStyle(
              color: !state.isApproved ? Colors.white54 : Colors.black,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildActiveTripPanel(ride, ChatState chatState) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'ACTIVE TRIP DISPATCH',
                  style: TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '#${ride.bookingCode}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primaryYellow.withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                ride.status,
                style: const TextStyle(
                  color: AppTheme.primaryYellow,
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Communication row: Chat with Rider & Call
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  ChatSheet.show(context, ride.id, 'RIDER');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryYellow,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                icon: const Icon(Icons.chat_bubble_outline, size: 16),
                label: const Text('Chat with Rider'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Live Driving Simulation Toggle Button
        OutlinedButton.icon(
          onPressed: () => _handleSimulationToggle(
            ride,
            ref.read(driverDashboardProvider).currentDriverLocation,
          ),
          style: OutlinedButton.styleFrom(
            side: BorderSide(
              color: ref.watch(driverDashboardProvider).isSimulating
                  ? const Color(0xFFEF4444)
                  : const Color(0xFFFFC727),
            ),
            padding: const EdgeInsets.symmetric(vertical: 10),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          icon: Icon(
            ref.watch(driverDashboardProvider).isSimulating
                ? Icons.stop_circle_outlined
                : Icons.play_circle_fill_rounded,
            color: ref.watch(driverDashboardProvider).isSimulating
                ? const Color(0xFFEF4444)
                : const Color(0xFFFFC727),
            size: 18,
          ),
          label: Text(
            ref.watch(driverDashboardProvider).isSimulating
                ? 'Stop Driving Simulation'
                : '🚗 Simulate Live Driving to Target',
            style: TextStyle(
              color: ref.watch(driverDashboardProvider).isSimulating
                  ? const Color(0xFFEF4444)
                  : const Color(0xFFFFC727),
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Dynamic State Actions
        if (ride.status == 'ACCEPTED')
          ElevatedButton(
            onPressed: () =>
                ref.read(driverDashboardProvider.notifier).markArrived(),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
            child: const Text(
              'I Have Arrived at Pickup',
              style: TextStyle(color: Colors.white),
            ),
          )
        else if (ride.status == 'ARRIVED') ...[
          TextField(
            controller: _otpCtrl,
            keyboardType: TextInputType.number,
            maxLength: 4,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppTheme.primaryYellow,
              fontSize: 22,
              fontWeight: FontWeight.w900,
              letterSpacing: 4,
            ),
            decoration: const InputDecoration(
              hintText: 'Enter 4-Digit PIN',
              counterText: '',
            ),
          ),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: () {
              ref
                  .read(driverDashboardProvider.notifier)
                  .startRideWithOtp(_otpCtrl.text.trim());
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryYellow,
            ),
            child: const Text('Verify PIN & Start Trip'),
          ),
        ] else if (ride.status == 'IN_PROGRESS')
          ElevatedButton(
            onPressed: () =>
                ref.read(driverDashboardProvider.notifier).completeRide(),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.successGreen,
            ),
            child: const Text('Complete Trip & Collect Cash'),
          ),
      ],
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
            color: AppTheme.surfaceDark,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: AppTheme.primaryYellow),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.check_circle_rounded,
                color: AppTheme.successGreen,
                size: 54,
              ),
              const SizedBox(height: 12),
              const Text(
                'Trip Completed!',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                'Booking #${settlement['bookingCode']}',
                style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.cardDark,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total Passenger Fare:',
                          style: TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          '₹${settlement['totalFare']}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    const Divider(color: AppTheme.borderLight, height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Net Credited to Wallet:',
                          style: TextStyle(
                            color: AppTheme.successGreen,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '+₹${settlement['earnings']}',
                          style: const TextStyle(
                            color: AppTheme.successGreen,
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => ref
                    .read(driverDashboardProvider.notifier)
                    .dismissSettlement(),
                child: const Text('Ready for Next Dispatch'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
