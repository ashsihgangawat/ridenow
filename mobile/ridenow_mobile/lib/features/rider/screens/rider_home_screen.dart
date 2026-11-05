import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/widgets/ridenow_logo.dart';
import '../providers/rider_booking_provider.dart';
import '../providers/nearby_drivers_provider.dart';
import '../models/nearby_driver_model.dart';
import '../../maps/widgets/ridenow_map_widget.dart';
import '../../maps/widgets/pickup_destination_search_panel.dart';
import '../../maps/widgets/vehicle_selection_bottom_sheet.dart';
import '../../maps/services/geoapify_geocoding_service.dart';
import '../widgets/rider_active_ride_card.dart';

class RiderHomeScreen extends ConsumerStatefulWidget {
  final VoidCallback? onNavigateToServices;
  final VoidCallback? onNavigateToActivity;
  final VoidCallback? onNavigateToAccount;

  const RiderHomeScreen({
    super.key,
    this.onNavigateToServices,
    this.onNavigateToActivity,
    this.onNavigateToAccount,
  });

  @override
  ConsumerState<RiderHomeScreen> createState() => _RiderHomeScreenState();
}

class _RiderHomeScreenState extends ConsumerState<RiderHomeScreen> {
  final GlobalKey<RideNowMapWidgetState> _mapKey = GlobalKey<RideNowMapWidgetState>();
  final GeoapifyGeocodingService _geocoding = GeoapifyGeocodingService();

  bool _isBooking = false;
  bool _isPickerMode = false;
  bool _showBanner = true;
  String _selectedRideOptionId = 'BIKE';
  String _selectedPaymentMethod = 'CASH';

  final List<Map<String, dynamic>> _quickSpots = [
    {
      'title': 'Indore Airport (IDR)',
      'subtitle': 'Devi Ahilyabai Holkar Airport',
      'lat': 22.7217,
      'lng': 75.8011,
      'icon': Icons.flight_takeoff_rounded,
    },
    {
      'title': 'Indore Junction Railway',
      'subtitle': 'Chhoti Gwaltoli, Indore',
      'lat': 22.7177,
      'lng': 75.8682,
      'icon': Icons.train_rounded,
    },
    {
      'title': 'Rajwada Palace',
      'subtitle': 'Heritage Center, Indore',
      'lat': 22.7196,
      'lng': 75.8577,
      'icon': Icons.account_balance_rounded,
    },
    {
      'title': '56 Dukan (Chappan Dukan)',
      'subtitle': 'New Palasia Food Hub, Indore',
      'lat': 22.7244,
      'lng': 75.8839,
      'icon': Icons.restaurant_rounded,
    },
    {
      'title': 'Vijay Nagar Square',
      'subtitle': 'AB Road, Commercial Center',
      'lat': 22.7533,
      'lng': 75.8937,
      'icon': Icons.business_rounded,
    },
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final booking = ref.read(riderBookingProvider);
      // Auto-reverse geocode current GPS location to street address
      if (booking.pickupAddress.isEmpty || booking.pickupAddress == 'Current location') {
        _geocoding.reverseGeocode(booking.pickupPoint).then((addr) {
          if (addr != null && mounted) {
            ref.read(riderBookingProvider.notifier).setPickup(booking.pickupPoint, addr);
          }
        }).catchError((_) {});
      }
      // Start periodic nearby drivers polling
      ref.read(nearbyDriversProvider.notifier).startPeriodicUpdates(booking.pickupPoint);
    });
  }

  @override
  void dispose() {
    ref.read(nearbyDriversProvider.notifier).stopPeriodicUpdates();
    super.dispose();
  }

  void _onPickupSelected(LatLng point, String address) {
    ref.read(riderBookingProvider.notifier).setPickup(point, address);
  }

  void _onDestinationSelected(LatLng point, String address) {
    ref.read(riderBookingProvider.notifier).setDestination(point, address);
    setState(() => _isPickerMode = false);
  }

  void _togglePickerMode() {
    setState(() {
      _isPickerMode = !_isPickerMode;
    });
    if (_isPickerMode) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('📍 Drag map to position destination pin, then tap Confirm'),
          duration: Duration(seconds: 2),
          backgroundColor: Color(0xFF0F172A),
        ),
      );
    }
  }

  void _confirmPickerLocation() {
    final center = _mapKey.currentState?.centerPoint ?? ref.read(riderBookingProvider).pickupPoint;
    _geocoding.reverseGeocode(center).then((addr) {
      final resolved = addr ?? 'Pinned Location (${center.latitude.toStringAsFixed(3)}, ${center.longitude.toStringAsFixed(3)})';
      _onDestinationSelected(center, resolved);
    }).catchError((_) {
      _onDestinationSelected(center, 'Pinned Location');
    });
  }

  void _showDriverCallout(NearbyDriverModel driver) {
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        backgroundColor: const Color(0xFF0F172A),
        content: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: driver.isBike
                    ? const Color(0xFFFFC727)
                    : driver.isAuto
                        ? const Color(0xFF10B981)
                        : const Color(0xFF38BDF8),
                shape: BoxShape.circle,
              ),
              child: Icon(
                driver.isBike
                    ? Icons.two_wheeler_rounded
                    : driver.isAuto
                        ? Icons.electric_rickshaw_rounded
                        : Icons.directions_car_filled_rounded,
                color: Colors.black,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'RideNow ${driver.vehicleType} • ${driver.vehicleModel}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                  ),
                  Text(
                    '${driver.distanceKm.toStringAsFixed(1)} km away • Available now • ${driver.vehicleNumber}',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ),
          ],
        ),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Future<void> _confirmRideBooking() async {
    if (_isBooking) return;
    setState(() => _isBooking = true);

    try {
      final ok = await ref.read(riderBookingProvider.notifier).bookRide();
      if (mounted) {
        setState(() => _isBooking = false);
        if (ok) {
          final ride = ref.read(riderBookingProvider).currentRide;
          if (ride != null) {
            context.push('/rider/ride/${ride.id}');
          }
        } else {
          final errorMsg = ref.read(riderBookingProvider).error;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMsg != null && errorMsg.isNotEmpty ? errorMsg : 'Could not book ride. Please retry.'),
              backgroundColor: Colors.red[700],
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isBooking = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red[700]),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookingState = ref.watch(riderBookingProvider);
    final nearbyState = ref.watch(nearbyDriversProvider);

    // 1. If destination is filled, present full-screen Ride Selection & Fare Confirmation
    if (bookingState.dropPoint != null) {
      return _buildRideSelectionScreen(bookingState, nearbyState);
    }

    // 2. Full-Screen Interactive Live Map Home View (Uber / Ola Style)
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // A. Full-Screen Interactive Map Canvas (Guaranteed 100% viewport coverage)
          Positioned.fill(
            child: RideNowMapWidget(
              key: _mapKey,
              riderCurrentLocation: bookingState.pickupPoint,
              nearbyDrivers: nearbyState.filteredDrivers,
              onDriverTap: _showDriverCallout,
              isPickerMode: _isPickerMode,
              pickerPromptText: 'Move map to choose destination',
              controlsBottomPadding: _isPickerMode ? 170.0 : 260.0,
            ),
          ),

          // B. Top Floating Bar (RideNow Brand + Profile & Notifications)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Brand Header Row
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4),
                    child: Row(
                      children: [
                        const RideNowLogo(height: 28),
                        const Spacer(),
                        // Inbox Button
                        InkWell(
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('No new notifications in Inbox.'), duration: Duration(seconds: 1)),
                            );
                          },
                          borderRadius: BorderRadius.circular(20),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6)],
                            ),
                            child: Row(
                              children: const [
                                Icon(Icons.notifications_none_rounded, size: 16, color: Colors.black87),
                                SizedBox(width: 4),
                                Text('Inbox', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Account Avatar
                        InkWell(
                          onTap: () {
                            if (widget.onNavigateToAccount != null) {
                              widget.onNavigateToAccount!();
                            } else {
                              context.push('/rider/profile');
                            }
                          },
                          borderRadius: BorderRadius.circular(20),
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F172A),
                              shape: BoxShape.circle,
                              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6)],
                            ),
                            child: const Center(
                              child: Icon(Icons.person_rounded, color: Color(0xFFFFC727), size: 18),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Floating Search Panel (Pickup + "Where to?")
                  if (!_isPickerMode)
                    PickupDestinationSearchPanel(
                      pickupAddress: bookingState.pickupAddress,
                      dropAddress: bookingState.dropAddress,
                      pickupPoint: bookingState.pickupPoint,
                      onPickupSelected: _onPickupSelected,
                      onDestinationSelected: _onDestinationSelected,
                      onChooseOnMap: _togglePickerMode,
                    ),

                  // Floating Vehicle Category Filters
                  if (!_isPickerMode)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 2),
                      child: Row(
                        children: [
                          _buildFilterChip('All Fleet', 'ALL', null, nearbyState.selectedFilter == 'ALL'),
                          const SizedBox(width: 6),
                          _buildFilterChip('Bike', 'BIKE', Icons.two_wheeler_rounded, nearbyState.selectedFilter == 'BIKE'),
                          const SizedBox(width: 6),
                          _buildFilterChip('Auto', 'AUTO', Icons.electric_rickshaw_rounded, nearbyState.selectedFilter == 'AUTO'),
                          const SizedBox(width: 6),
                          _buildFilterChip('Cab', 'CAB', Icons.directions_car_filled_rounded, nearbyState.selectedFilter == 'CAB'),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),

          // C. Bottom Explore & Scrollable Services Sheet (Swipe up to view all services & offers)
          if (!_isPickerMode)
            DraggableScrollableSheet(
              initialChildSize: 0.28,
              minChildSize: 0.22,
              maxChildSize: 0.88,
              snap: true,
              snapSizes: const [0.28, 0.58, 0.88],
              builder: (context, scrollController) {
                return Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.16),
                        blurRadius: 20,
                        offset: const Offset(0, -4),
                      ),
                    ],
                  ),
                  child: SingleChildScrollView(
                    controller: scrollController,
                    padding: const EdgeInsets.fromLTRB(16, 10, 16, 120),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Drag Handle
                        Center(
                          child: Container(
                            width: 44,
                            height: 4.5,
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade300,
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),

                        // Section 1: Quick Fleet Selection Row (Bike, Auto, Cab, Prime)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildQuickServicePill('Bike', 'BIKE', Icons.two_wheeler_rounded, const Color(0xFFF59E0B)),
                            _buildQuickServicePill('Auto', 'AUTO', Icons.electric_rickshaw_rounded, const Color(0xFF10B981)),
                            _buildQuickServicePill('Cab', 'MINI', Icons.directions_car_filled_rounded, const Color(0xFF3B82F6)),
                            _buildQuickServicePill('Prime', 'SEDAN', Icons.directions_car_rounded, const Color(0xFF6366F1)),
                          ],
                        ),

                        const Divider(height: 20, thickness: 0.8),

                        // Section 2: Popular Destinations in Indore (Quick Horizontal Scroll)
                        Row(
                          children: const [
                            Icon(Icons.history_rounded, size: 14, color: Colors.grey),
                            SizedBox(width: 6),
                            Text(
                              'Popular Destinations in Indore',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Colors.black54,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        SizedBox(
                          height: 36,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: _quickSpots.length,
                            separatorBuilder: (_, __) => const SizedBox(width: 8),
                            itemBuilder: (context, index) {
                              final spot = _quickSpots[index];
                              return InkWell(
                                onTap: () {
                                  _onDestinationSelected(
                                    LatLng(spot['lat'] as double, spot['lng'] as double),
                                    spot['title'] as String,
                                  );
                                },
                                borderRadius: BorderRadius.circular(16),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(spot['icon'] as IconData, size: 13, color: const Color(0xFFF59E0B)),
                                      const SizedBox(width: 5),
                                      Text(
                                        spot['title'] as String,
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.black87,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),

                        // Section 3: "Services / For you" Grid (Revealed when dragged up)
                        const SizedBox(height: 22),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Services',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                color: Colors.black,
                              ),
                            ),
                            InkWell(
                              onTap: () {
                                widget.onNavigateToServices?.call();
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                child: Row(
                                  children: const [
                                    Text(
                                      'View all',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF2563EB),
                                      ),
                                    ),
                                    SizedBox(width: 2),
                                    Icon(
                                      Icons.arrow_forward_ios_rounded,
                                      size: 11,
                                      color: Color(0xFF2563EB),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // 8 Circular Services Grid (2 rows x 4 columns)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildCircularService(
                              name: 'Bike Saver',
                              icon: Icons.two_wheeler,
                              iconColor: const Color(0xFFF59E0B),
                              onTap: () => _selectService('BIKE', 'Bike Saver'),
                            ),
                            _buildCircularService(
                              name: 'Auto',
                              icon: Icons.electric_rickshaw,
                              iconColor: const Color(0xFF10B981),
                              onTap: () => _selectService('AUTO', 'Auto'),
                            ),
                            _buildCircularService(
                              name: 'Trip',
                              icon: Icons.directions_car_filled,
                              iconColor: const Color(0xFF3B82F6),
                              onTap: () => _selectService('MINI', 'Trip'),
                            ),
                            _buildCircularService(
                              name: 'Rentals',
                              icon: Icons.access_time_filled_rounded,
                              iconColor: const Color(0xFF64748B),
                              onTap: () => _selectService('SEDAN', 'Rentals'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildCircularService(
                              name: 'Intercity',
                              icon: Icons.luggage_rounded,
                              iconColor: const Color(0xFF8B5CF6),
                              onTap: () => _selectService('SUV', 'Intercity'),
                            ),
                            _buildCircularService(
                              name: 'Parcel',
                              icon: Icons.inventory_2_rounded,
                              iconColor: const Color(0xFFF97316),
                              onTap: () => _selectService('BIKE', 'Parcel'),
                            ),
                            _buildCircularService(
                              name: 'Reserve',
                              icon: Icons.event_available_rounded,
                              iconColor: const Color(0xFF6366F1),
                              badgeText: 'Promo',
                              onTap: () => _selectService('AUTO', 'Reserve'),
                            ),
                            _buildCircularService(
                              name: 'Teens',
                              icon: Icons.backpack_rounded,
                              iconColor: const Color(0xFF06B6D4),
                              onTap: () => _selectService('AUTO', 'Teens'),
                            ),
                          ],
                        ),

                        // Section 4: Promo Banner ("Affordable Auto Rides")
                        if (_showBanner) ...[
                          const SizedBox(height: 20),
                          Container(
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: const Color(0xFFFDE68A),
                                width: 1.5,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text(
                                      'Affordable Auto Rides',
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.black,
                                      ),
                                    ),
                                    Container(
                                      width: 40,
                                      height: 40,
                                      decoration: const BoxDecoration(
                                        color: Colors.white,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.electric_rickshaw,
                                        color: Color(0xFF10B981),
                                        size: 22,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Save big on everyday city rides with zero platform commission.',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    ElevatedButton(
                                      onPressed: () => _selectService('AUTO', 'Auto'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.black,
                                        foregroundColor: Colors.white,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(18),
                                        ),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 14,
                                          vertical: 8,
                                        ),
                                      ),
                                      child: const Text(
                                        'Book now',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(
                                          color: const Color(0xFFE2E8F0),
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: const [
                                          Text(
                                            'Best Fare Guaranteed',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.black87,
                                            ),
                                          ),
                                          SizedBox(width: 3),
                                          Icon(
                                            Icons.verified_rounded,
                                            size: 13,
                                            color: Color(0xFF10B981),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const Spacer(),
                                    IconButton(
                                      icon: const Icon(
                                        Icons.close,
                                        size: 16,
                                        color: Colors.black54,
                                      ),
                                      onPressed: () {
                                        setState(() => _showBanner = false);
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],

                        // Section 5: All Indore Hotspots List
                        const SizedBox(height: 22),
                        const Text(
                          'Suggested Destinations',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: Colors.black,
                          ),
                        ),
                        const SizedBox(height: 8),
                        ..._quickSpots.map((spot) {
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Container(
                              width: 38,
                              height: 38,
                              decoration: const BoxDecoration(
                                color: Color(0xFFF1F5F9),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                spot['icon'] as IconData,
                                color: const Color(0xFF0F172A),
                                size: 18,
                              ),
                            ),
                            title: Text(
                              spot['title'] as String,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            subtitle: Text(
                              spot['subtitle'] as String,
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                            trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.grey),
                            onTap: () {
                              _onDestinationSelected(
                                LatLng(spot['lat'] as double, spot['lng'] as double),
                                spot['title'] as String,
                              );
                            },
                          );
                        }),
                      ],
                    ),
                  ),
                );
              },
            ),

          // D. If In Picker Mode: Elevated Confirm Pin Button (Floating well above bottom bar)
          if (_isPickerMode)
            Positioned(
              left: 20,
              right: 20,
              bottom: 100, // Elevated well above floating nav bar
              child: ElevatedButton.icon(
                onPressed: _confirmPickerLocation,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFFC727),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                  elevation: 6,
                  shadowColor: Colors.black45,
                ),
                icon: const Icon(Icons.check_circle_rounded, size: 22),
                label: const Text('Confirm Destination Here', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
              ),
            ),
        ],
      ),
    );
  }

  void _selectService(String category, String name) {
    ref.read(riderBookingProvider.notifier).selectCategory(category);
    setState(() => _selectedRideOptionId = category);
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Selected $name. Tap "Where to?" above to set destination.'),
        backgroundColor: const Color(0xFF0F172A),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Widget _buildCircularService({
    required String name,
    required IconData icon,
    required Color iconColor,
    String? badgeText,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(
        width: 72,
        child: Column(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 58,
                  height: 58,
                  decoration: const BoxDecoration(
                    color: Color(0xFFF1F5F9),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Icon(icon, color: iconColor, size: 28),
                  ),
                ),
                if (badgeText != null)
                  Positioned(
                    top: -4,
                    right: -2,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2563EB),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        badgeText,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              name,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickServicePill(String name, String category, IconData icon, Color color) {
    return InkWell(
      onTap: () {
        ref.read(riderBookingProvider.notifier).selectCategory(category);
        setState(() => _selectedRideOptionId = category);
      },
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Icon(icon, color: color, size: 24),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              name,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String filterKey, IconData? icon, bool isSelected) {
    return InkWell(
      onTap: () => ref.read(nearbyDriversProvider.notifier).setFilter(filterKey),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFFC727) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFFEAB308) : Colors.grey.shade300,
            width: isSelected ? 1.5 : 1.0,
          ),
          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 1))],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 13, color: isSelected ? Colors.black : Colors.black87),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                color: isSelected ? Colors.black : Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRideSelectionScreen(RiderBookingState bookingState, NearbyDriversState nearbyState) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Full-Screen Interactive Route Map
          Positioned.fill(
            child: RideNowMapWidget(
              riderCurrentLocation: bookingState.pickupPoint,
              nearbyDrivers: nearbyState.filteredDrivers,
              pickupPoint: bookingState.pickupPoint,
              destinationPoint: bookingState.dropPoint,
              driverPoint: bookingState.liveDriverLocation,
              driverHeading: bookingState.driverHeading,
              routePolyline: bookingState.route?.polylinePoints,
              controlsBottomPadding: MediaQuery.of(context).size.height * 0.62,
            ),
          ),

          // 2. Top Header Navigation (Back Button & Add Stop Pill)
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 16,
            right: 16,
            child: Row(
              children: [
                Material(
                  elevation: 4,
                  shape: const CircleBorder(),
                  color: Colors.white,
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: () {
                      ref.read(riderBookingProvider.notifier).clearDestination();
                    },
                    child: const Padding(
                      padding: EdgeInsets.all(10),
                      child: Icon(
                        Icons.arrow_back_ios_new_rounded,
                        size: 20,
                        color: Colors.black,
                      ),
                    ),
                  ),
                ),
                const Spacer(),
                Material(
                  elevation: 4,
                  borderRadius: BorderRadius.circular(24),
                  color: Colors.white,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(24),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Multi-stop booking feature coming soon.'),
                          duration: Duration(seconds: 1),
                        ),
                      );
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.add_rounded, size: 18, color: Colors.black),
                          SizedBox(width: 4),
                          Text(
                            'Add stop',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 3. Sliding Ride Options Bottom Sheet
          Align(
            alignment: Alignment.bottomCenter,
            child: VehicleSelectionBottomSheet(
              bookingState: bookingState,
              selectedOptionId: _selectedRideOptionId,
              selectedPaymentMethod: _selectedPaymentMethod,
              isBooking: _isBooking,
              onSelectOption: (optionId, category) {
                setState(() => _selectedRideOptionId = optionId);
                ref.read(riderBookingProvider.notifier).selectCategory(category);
              },
              onTogglePaymentMethod: () {
                setState(() {
                  _selectedPaymentMethod = _selectedPaymentMethod == 'CASH' ? 'ONLINE' : 'CASH';
                });
              },
              onApplyCoupon: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Coupon "FIRST50" auto-applied! Save ₹50 on this ride.'),
                    backgroundColor: Color(0xFF059669),
                    duration: Duration(seconds: 2),
                  ),
                );
              },
              onConfirmBooking: _confirmRideBooking,
            ),
          ),
        ],
      ),
    );
  }
}
