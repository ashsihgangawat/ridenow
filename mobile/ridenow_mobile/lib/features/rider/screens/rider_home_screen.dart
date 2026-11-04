import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/widgets/ridenow_logo.dart';
import '../providers/rider_booking_provider.dart';
import '../../maps/widgets/openfree_map_widget.dart';
import '../../maps/services/photon_geocoding_service.dart';

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
  final TextEditingController _pickupSearchCtrl = TextEditingController();
  final TextEditingController _destSearchCtrl = TextEditingController();
  final FocusNode _pickupFocus = FocusNode();
  final FocusNode _destFocus = FocusNode();
  final PhotonGeocodingService _geocoding = PhotonGeocodingService();

  List<GeocodingResult> _searchResults = [];
  bool _isSearching = false;
  bool _isSearchExpanded = false;
  String _activeSearchField = 'drop'; // 'pickup' | 'drop'
  String _selectedMode = 'RIDES'; // 'RIDES' | 'PARCEL'
  bool _showBanner = true;
  bool _isBooking = false;
  String _selectedRideOptionId = 'BIKE';
  String _selectedPaymentMethod = 'CASH';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final booking = ref.read(riderBookingProvider);
      _pickupSearchCtrl.text = booking.pickupAddress;
      if (booking.dropAddress.isNotEmpty) {
        _destSearchCtrl.text = booking.dropAddress;
      }
    });

    _pickupFocus.addListener(() {
      if (_pickupFocus.hasFocus) {
        setState(() {
          _activeSearchField = 'pickup';
          _isSearchExpanded = true;
        });
        if (_pickupSearchCtrl.text.isNotEmpty) {
          _onSearchChanged(_pickupSearchCtrl.text);
        }
      } else {
        // Auto-commit manual pickup address on blur
        final clean = _pickupSearchCtrl.text.trim();
        if (clean.isNotEmpty &&
            clean != ref.read(riderBookingProvider).pickupAddress) {
          _handleManualSubmit(clean, 'pickup');
        }
      }
    });

    _destFocus.addListener(() {
      if (_destFocus.hasFocus) {
        setState(() {
          _activeSearchField = 'drop';
          _isSearchExpanded = true;
        });
        if (_destSearchCtrl.text.isNotEmpty) {
          _onSearchChanged(_destSearchCtrl.text);
        }
      } else {
        // Auto-commit manual drop address on blur
        final clean = _destSearchCtrl.text.trim();
        if (clean.isNotEmpty &&
            clean != ref.read(riderBookingProvider).dropAddress) {
          _handleManualSubmit(clean, 'drop');
        }
      }
    });
  }

  @override
  void dispose() {
    _pickupSearchCtrl.dispose();
    _destSearchCtrl.dispose();
    _pickupFocus.dispose();
    _destFocus.dispose();
    super.dispose();
  }

  void _onSearchChanged(String val) async {
    if (val.trim().isEmpty) {
      setState(() => _searchResults = []);
      return;
    }
    setState(() => _isSearching = true);
    final results = await _geocoding.search(val);
    if (mounted) {
      setState(() {
        _searchResults = results;
        _isSearching = false;
      });
    }
  }

  void _selectSearchResult(GeocodingResult res) {
    if (_activeSearchField == 'pickup') {
      _pickupSearchCtrl.text = res.displayName;
      ref
          .read(riderBookingProvider.notifier)
          .setPickup(res.point, res.displayName);
      setState(() {
        _searchResults = [];
        _activeSearchField = 'drop';
      });
      _destFocus.requestFocus();
    } else {
      _destSearchCtrl.text = res.displayName;
      ref
          .read(riderBookingProvider.notifier)
          .setDestination(res.point, res.displayName);
      setState(() {
        _searchResults = [];
      });
      _destFocus.unfocus();
    }
  }

  Future<void> _handleManualSubmit(String val, String field) async {
    final clean = val.trim();
    if (clean.isEmpty) return;

    if (field == 'pickup') {
      final res = await _geocoding.resolveManualLocation(clean, isDrop: false);
      _pickupSearchCtrl.text = clean;
      ref.read(riderBookingProvider.notifier).setPickup(res.point, clean);
      setState(() {
        _searchResults = [];
        _activeSearchField = 'drop';
      });
      _destFocus.requestFocus();
    } else {
      final res = await _geocoding.resolveManualLocation(
        clean,
        isDrop: true,
        referencePoint: ref.read(riderBookingProvider).pickupPoint,
      );
      _destSearchCtrl.text = clean;
      ref.read(riderBookingProvider.notifier).setDestination(res.point, clean);
      setState(() {
        _searchResults = [];
      });
      _destFocus.unfocus();
    }
  }

  void _onBookRidePressed() async {
    final cleanDest = _destSearchCtrl.text.trim();
    final cleanPickup = _pickupSearchCtrl.text.trim();

    if (cleanDest.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a drop location to book your ride.'),
          backgroundColor: Colors.orange,
          duration: Duration(seconds: 2),
        ),
      );
      setState(() {
        _activeSearchField = 'drop';
        _isSearchExpanded = true;
      });
      _destFocus.requestFocus();
      return;
    }

    setState(() => _isBooking = true);

    try {
      // 1. Resolve Pickup if user typed a custom pickup
      final currentPickup = ref.read(riderBookingProvider).pickupAddress;
      if (cleanPickup.isNotEmpty && cleanPickup != currentPickup) {
        final resolvedPickup = await _geocoding.resolveManualLocation(
          cleanPickup,
          isDrop: false,
        );
        ref
            .read(riderBookingProvider.notifier)
            .setPickup(resolvedPickup.point, cleanPickup);
      }

      // 2. Resolve Destination & Open Ride Selection Sheet
      final resolvedDrop = await _geocoding.resolveManualLocation(
        cleanDest,
        isDrop: true,
        referencePoint: ref.read(riderBookingProvider).pickupPoint,
      );
      ref
          .read(riderBookingProvider.notifier)
          .setDestination(resolvedDrop.point, cleanDest);

      if (mounted) {
        setState(() {
          _isBooking = false;
          _isSearchExpanded = false;
          _searchResults = [];
        });
        _pickupFocus.unfocus();
        _destFocus.unfocus();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isBooking = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error booking ride: $e'),
            backgroundColor: Colors.red[700],
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  void _selectService(String category, String name) {
    ref.read(riderBookingProvider.notifier).selectCategory(category);
    setState(() {
      _isSearchExpanded = true;
      _activeSearchField = 'drop';
    });
    _destFocus.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final bookingState = ref.watch(riderBookingProvider);

    // When destination is filled, present the Ride Selection Screen matching Rapido/Ola UI
    if (bookingState.dropPoint != null) {
      return _buildRideConfirmationScreen(bookingState);
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            // Main Scrollable Content (Matching User Image 3)
            SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 120),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // RideNow Official Brand Header
                  const Padding(
                    padding: EdgeInsets.fromLTRB(20, 4, 20, 2),
                    child: RideNowLogo(height: 30),
                  ),

                  // 1. Top Bar: Current location + Inbox
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 8,
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(0xFF2563EB), // Blue dot
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Flexible(
                                child: Text(
                                  bookingState.pickupAddress.isNotEmpty &&
                                          !bookingState.pickupAddress.contains('Rajwada')
                                      ? bookingState.pickupAddress
                                      : 'Current location',
                                  style: const TextStyle(
                                    color: Colors.black,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(
                                Icons.keyboard_arrow_down_rounded,
                                color: Colors.black,
                                size: 18,
                              ),
                            ],
                          ),
                        ),
                        const Spacer(),
                        InkWell(
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('No new notifications in Inbox.'),
                                duration: Duration(seconds: 1),
                              ),
                            );
                          },
                          borderRadius: BorderRadius.circular(20),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            child: Row(
                              children: const [
                                Icon(
                                  Icons.notifications_none_rounded,
                                  color: Colors.black,
                                  size: 20,
                                ),
                                SizedBox(width: 4),
                                Text(
                                  'Inbox',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
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
                              color: const Color(0xFF9E9E9E).withOpacity(0.2),
                              shape: BoxShape.circle,
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.person,
                                color: Colors.black87,
                                size: 18,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // 2. Mode Switcher (Rides vs Parcel)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        _buildModeTab(
                          title: 'Rides',
                          icon: Icons.directions_car_filled,
                          isSelected: _selectedMode == 'RIDES',
                          onTap: () => setState(() => _selectedMode = 'RIDES'),
                        ),
                        const SizedBox(width: 24),
                        _buildModeTab(
                          title: 'Parcel',
                          icon: Icons.inventory_2_rounded,
                          isSelected: _selectedMode == 'PARCEL',
                          onTap: () => setState(() => _selectedMode = 'PARCEL'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // 3. Search Bar / Expanded Search View (Matching Image 3 & Image 2)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: _isSearchExpanded
                        ? _buildExpandedSearchCard(bookingState)
                        : _buildPillSearchBar(bookingState),
                  ),
                  const SizedBox(height: 24),

                  // 4. "For you ›" Section (Matching User Image 3)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'For you',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: Colors.black,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.arrow_forward_ios_rounded,
                            size: 16,
                            color: Colors.black,
                          ),
                          onPressed: () {
                            widget.onNavigateToServices?.call();
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // 8 Services Grid (2 rows x 4 columns)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      children: [
                        // Row 1: Bike Saver, Auto, Trip, Rentals
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

                        // Row 2: Intercity, Parcel, Reserve, Teens
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
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 5. Promo Banner: "Enjoy 100% off Auto" (Matching User Image 3)
                  if (_showBanner)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(24),
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
                                    fontSize: 20,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.black,
                                  ),
                                ),
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.electric_rickshaw,
                                    color: Color(0xFF10B981),
                                    size: 26,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Save big on everyday city rides with zero platform commission.',
                              style: TextStyle(
                                fontSize: 13,
                                color: Color(0xFF64748B),
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Floating Book Now Pill
                            Row(
                              children: [
                                ElevatedButton(
                                  onPressed: () {
                                    _selectService('AUTO', 'Auto');
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.black,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 10,
                                    ),
                                  ),
                                  child: const Text(
                                    'Book now',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(20),
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
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.black,
                                        ),
                                      ),
                                      SizedBox(width: 4),
                                      Icon(
                                        Icons.info_outline,
                                        size: 14,
                                        color: Colors.black54,
                                      ),
                                    ],
                                  ),
                                ),
                                const Spacer(),
                                IconButton(
                                  icon: const Icon(
                                    Icons.close,
                                    size: 18,
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
                    ),
                  const SizedBox(height: 24),

                  // 6. Interactive Live Route Map (OpenFreeMap)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Live Map & Fleet',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: Colors.black,
                              ),
                            ),
                            if (bookingState.dropPoint != null)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF3C7),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  '${bookingState.route?.distanceKm ?? 3.5} km • ~${bookingState.route?.durationMinutes ?? 10} mins',
                                  style: const TextStyle(
                                    color: Color(0xFFD97706),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Container(
                          height: 220,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.06),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: OpenFreeMapWidget(
                            pickupPoint: bookingState.pickupPoint,
                            destinationPoint: bookingState.dropPoint,
                            driverPoint: bookingState.liveDriverLocation,
                            driverHeading: bookingState.driverHeading,
                            routePolyline: bookingState.route?.polylinePoints,
                            onMapTap: (point) {
                              ref
                                  .read(riderBookingProvider.notifier)
                                  .setDestination(
                                    point,
                                    'Pin (${point.latitude.toStringAsFixed(3)}, ${point.longitude.toStringAsFixed(3)})',
                                  );
                              _destSearchCtrl.text =
                                  'Pin (${point.latitude.toStringAsFixed(3)}, ${point.longitude.toStringAsFixed(3)})';
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // 7. Vehicle Category & Confirm Booking Bar
                  if (bookingState.dropPoint != null)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: _buildFareAndCategoryPicker(bookingState),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- MODE TAB (Rides vs Parcel) ---
  Widget _buildModeTab({
    required String title,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: Colors.black),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: Colors.black,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            height: 3,
            width: 70,
            color: isSelected ? Colors.black : Colors.transparent,
          ),
        ],
      ),
    );
  }

  // --- PILL SEARCH BAR (Where to? + Later) ---
  Widget _buildPillSearchBar(RiderBookingState state) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          const Icon(Icons.search, color: Colors.black, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: InkWell(
              onTap: () {
                setState(() {
                  _isSearchExpanded = true;
                  _activeSearchField = 'drop';
                });
                _destFocus.requestFocus();
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Text(
                  state.dropAddress.isNotEmpty
                      ? state.dropAddress
                      : 'Where to?',
                  style: TextStyle(
                    color: state.dropAddress.isNotEmpty
                        ? Colors.black
                        : const Color(0xFF64748B),
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ),
          InkWell(
            onTap: () {
              setState(() {
                _isSearchExpanded = true;
                _activeSearchField = 'drop';
              });
              _destFocus.requestFocus();
            },
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 4,
                  ),
                ],
              ),
              child: Row(
                children: const [
                  Icon(
                    Icons.calendar_today_rounded,
                    size: 15,
                    color: Colors.black,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'Later',
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // --- CIRCULAR SERVICE ITEM (For you section) ---
  Widget _buildCircularService({
    required String name,
    required IconData icon,
    required Color iconColor,
    String? badgeText,
    IconData? badgeIcon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 72,
        child: Column(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                // Circular container
                Container(
                  width: 62,
                  height: 62,
                  decoration: const BoxDecoration(
                    color: Color(0xFFF1F5F9),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Icon(icon, color: iconColor, size: 28),
                  ),
                ),

                // Red Badge Tag (e.g. 100% or Promo)
                if (badgeText != null)
                  Positioned(
                    top: -4,
                    right: -2,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 5,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDC2626),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (badgeIcon != null) ...[
                            Icon(badgeIcon, color: Colors.white, size: 8),
                            const SizedBox(width: 2),
                          ],
                          Text(
                            badgeText,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              name,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0F172A),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // --- EXPANDED PICKUP & DROP SEARCH CARD ---
  Widget _buildExpandedSearchCard(RiderBookingState state) {
    final activeText = _activeSearchField == 'pickup'
        ? _pickupSearchCtrl.text.trim()
        : _destSearchCtrl.text.trim();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF4F6F9),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 16,
            spreadRadius: 2,
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
              const Text(
                'Where are you going?',
                style: TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                ),
              ),
              IconButton(
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                icon: const Icon(
                  Icons.close_rounded,
                  color: Color(0xFF64748B),
                  size: 20,
                ),
                onPressed: () {
                  setState(() => _isSearchExpanded = false);
                  _pickupFocus.unfocus();
                  _destFocus.unfocus();
                },
              ),
            ],
          ),
          const SizedBox(height: 12),

          // 1. Enter Pickup Location Input
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: _activeSearchField == 'pickup'
                    ? const Color(0xFFFFC727)
                    : const Color(0xFFCBD5E1),
                width: _activeSearchField == 'pickup' ? 2 : 1,
              ),
            ),
            child: TextField(
              controller: _pickupSearchCtrl,
              focusNode: _pickupFocus,
              textInputAction: TextInputAction.next,
              onSubmitted: (val) => _handleManualSubmit(val, 'pickup'),
              onTap: () => setState(() => _activeSearchField = 'pickup'),
              onChanged: (val) {
                setState(() => _activeSearchField = 'pickup');
                _onSearchChanged(val);
              },
              style: const TextStyle(
                color: Color(0xFF1E293B),
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
              decoration: InputDecoration(
                prefixIcon: const Padding(
                  padding: EdgeInsets.all(10.0),
                  child: Icon(
                    Icons.location_on,
                    color: Color(0xFF0F172A),
                    size: 24,
                  ),
                ),
                hintText: 'Enter Pickup Location',
                hintStyle: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 15,
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                suffixIcon: _pickupSearchCtrl.text.isNotEmpty
                    ? Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(
                              Icons.check_circle_rounded,
                              color: Color(0xFF10B981),
                              size: 20,
                            ),
                            tooltip: 'Set as Pickup',
                            onPressed: () => _handleManualSubmit(
                              _pickupSearchCtrl.text,
                              'pickup',
                            ),
                          ),
                          IconButton(
                            icon: const Icon(
                              Icons.clear,
                              color: Color(0xFF94A3B8),
                              size: 18,
                            ),
                            onPressed: () {
                              _pickupSearchCtrl.clear();
                              setState(() => _searchResults = []);
                            },
                          ),
                        ],
                      )
                    : IconButton(
                        icon: const Icon(
                          Icons.my_location,
                          color: Color(0xFFF59E0B),
                          size: 20,
                        ),
                        tooltip: 'Current Location',
                        onPressed: () {
                          _pickupSearchCtrl.text = 'Current location';
                          ref
                              .read(riderBookingProvider.notifier)
                              .setPickup(
                                const LatLng(22.7196, 75.8577),
                                'Current location',
                              );
                        },
                      ),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // 2. Enter Drop Location Input
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: _activeSearchField == 'drop'
                    ? const Color(0xFFFFC727)
                    : const Color(0xFFCBD5E1),
                width: _activeSearchField == 'drop' ? 2 : 1,
              ),
            ),
            child: TextField(
              controller: _destSearchCtrl,
              focusNode: _destFocus,
              textInputAction: TextInputAction.done,
              onSubmitted: (val) => _handleManualSubmit(val, 'drop'),
              onTap: () => setState(() => _activeSearchField = 'drop'),
              onChanged: (val) {
                setState(() => _activeSearchField = 'drop');
                _onSearchChanged(val);
              },
              style: const TextStyle(
                color: Color(0xFF1E293B),
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
              decoration: InputDecoration(
                prefixIcon: const Padding(
                  padding: EdgeInsets.all(10.0),
                  child: Icon(
                    Icons.adjust_rounded,
                    color: Color(0xFF0F172A),
                    size: 24,
                  ),
                ),
                hintText: 'Enter Drop Location',
                hintStyle: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 15,
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                suffixIcon: _isSearching
                    ? const Padding(
                        padding: EdgeInsets.all(12.0),
                        child: SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            color: Color(0xFFFFC727),
                            strokeWidth: 2,
                          ),
                        ),
                      )
                    : _destSearchCtrl.text.isNotEmpty
                        ? Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(
                                  Icons.check_circle_rounded,
                                  color: Color(0xFF10B981),
                                  size: 20,
                                ),
                                tooltip: 'Set as Destination',
                                onPressed: () => _handleManualSubmit(
                                  _destSearchCtrl.text,
                                  'drop',
                                ),
                              ),
                              IconButton(
                                icon: const Icon(
                                  Icons.clear,
                                  color: Color(0xFF94A3B8),
                                  size: 18,
                                ),
                                onPressed: () {
                                  _destSearchCtrl.clear();
                                  setState(() => _searchResults = []);
                                },
                              ),
                            ],
                          )
                        : null,
              ),
            ),
          ),

          // Custom Manual Confirmation & Suggestions
          if (activeText.isNotEmpty) ...[
            Container(
              constraints: const BoxConstraints(maxHeight: 200),
              margin: const EdgeInsets.only(top: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  InkWell(
                    onTap: () =>
                        _handleManualSubmit(activeText, _activeSearchField),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 11,
                      ),
                      decoration: const BoxDecoration(
                        color: Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.vertical(
                          top: Radius.circular(10),
                        ),
                        border: Border(
                          bottom: BorderSide(color: Color(0xFFFDE68A)),
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.check_circle_rounded,
                            color: Color(0xFFD97706),
                            size: 20,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Use: "$activeText"',
                                  style: const TextStyle(
                                    color: Color(0xFF92400E),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w900,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  'Tap or press Enter to set as ${_activeSearchField == 'pickup' ? 'pickup' : 'drop'} location',
                                  style: const TextStyle(
                                    color: Color(0xFFB45309),
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(
                            Icons.arrow_forward_rounded,
                            color: Color(0xFFD97706),
                            size: 16,
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (_searchResults.isNotEmpty)
                    Flexible(
                      child: ListView.separated(
                        shrinkWrap: true,
                        padding: EdgeInsets.zero,
                        itemCount: _searchResults.length,
                        separatorBuilder: (_, __) =>
                            const Divider(color: Color(0xFFF1F5F9), height: 1),
                        itemBuilder: (context, i) {
                          final item = _searchResults[i];
                          return ListTile(
                            dense: true,
                            leading: Icon(
                              _activeSearchField == 'pickup'
                                  ? Icons.location_on
                                  : Icons.adjust_rounded,
                              color: const Color(0xFFF59E0B),
                              size: 18,
                            ),
                            title: Text(
                              item.name,
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            subtitle: Text(
                              item.street,
                              style: const TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 11,
                              ),
                            ),
                            onTap: () => _selectSearchResult(item),
                          );
                        },
                      ),
                    ),
                ],
              ),
            ),
          ] else ...[
            const SizedBox(height: 10),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: PhotonGeocodingService.fallbackLandmarks.map((lm) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 6.0),
                    child: ActionChip(
                      backgroundColor: Colors.white,
                      elevation: 0,
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                      label: Text(
                        lm.name,
                        style: const TextStyle(
                          color: Color(0xFF1E293B),
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      onPressed: () => _selectSearchResult(lm),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
          const SizedBox(height: 16),

          // Find Rides Yellow Button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _isBooking ? null : _onBookRidePressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFFC727),
                foregroundColor: Colors.black,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isBooking
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: Colors.black,
                        strokeWidth: 2.5,
                      ),
                    )
                  : const Text(
                      'Find Rides',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.2,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  // --- FARE & FLEET VEHICLE PICKER ---
  Widget _buildFareAndCategoryPicker(RiderBookingState state) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Choose a ride',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: Colors.black,
                ),
              ),
              Text(
                'Affordable city rides',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildCategoryTile(
                  'BIKE',
                  'Moto',
                  '₹35',
                  Icons.two_wheeler,
                  state.selectedCategory == 'BIKE',
                ),
                const SizedBox(width: 8),
                _buildCategoryTile(
                  'AUTO',
                  'Auto',
                  '₹45',
                  Icons.electric_rickshaw,
                  state.selectedCategory == 'AUTO',
                ),
                const SizedBox(width: 8),
                _buildCategoryTile(
                  'MINI',
                  'Mini',
                  '₹70',
                  Icons.directions_car,
                  state.selectedCategory == 'MINI',
                ),
                const SizedBox(width: 8),
                _buildCategoryTile(
                  'SEDAN',
                  'Sedan',
                  '₹100',
                  Icons.directions_car_filled,
                  state.selectedCategory == 'SEDAN',
                ),
                const SizedBox(width: 8),
                _buildCategoryTile(
                  'SUV',
                  'XL SUV',
                  '₹150',
                  Icons.airport_shuttle,
                  state.selectedCategory == 'SUV',
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 48,
            child: ElevatedButton(
              onPressed: state.isLoading
                  ? null
                  : () async {
                      final ok = await ref
                          .read(riderBookingProvider.notifier)
                          .bookRide();
                      if (ok && mounted) {
                        final ride = ref.read(riderBookingProvider).currentRide;
                        if (ride != null) {
                          context.push('/rider/ride/${ride.id}');
                        }
                      } else if (!ok && mounted) {
                        final errorMsg = ref.read(riderBookingProvider).error;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              errorMsg != null && errorMsg.isNotEmpty
                                  ? 'Booking failed: $errorMsg'
                                  : 'Ride booking failed. Please verify your connection.',
                            ),
                            backgroundColor: Colors.red[700],
                            duration: const Duration(seconds: 4),
                          ),
                        );
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFFC727),
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: state.isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: Colors.black,
                        strokeWidth: 2,
                      ),
                    )
                  : Text(
                      'Confirm ${state.selectedCategory} RideNow',
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryTile(
    String cat,
    String name,
    String fare,
    IconData icon,
    bool isSelected,
  ) {
    return InkWell(
      onTap: () => ref.read(riderBookingProvider.notifier).selectCategory(cat),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        width: 86,
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFEF3C7) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected
                ? const Color(0xFFFFC727)
                : const Color(0xFFE2E8F0),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? const Color(0xFFD97706) : Colors.black87,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              name,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
            Text(
              fare,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0F172A),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // =========================================================
  // RAPIDO / UBER STYLE RIDE SELECTION VIEW (WHEN DESTINATION FILLED)
  // =========================================================
  Widget _buildRideConfirmationScreen(RiderBookingState bookingState) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // 1. Interactive Route Map
          Positioned.fill(
            child: OpenFreeMapWidget(
              pickupPoint: bookingState.pickupPoint,
              destinationPoint: bookingState.dropPoint,
              driverPoint: bookingState.liveDriverLocation,
              driverHeading: bookingState.driverHeading,
              routePolyline: bookingState.route?.polylinePoints,
              controlsBottomPadding: MediaQuery.of(context).size.height * 0.58,
            ),
          ),

          // 2. Top Header Navigation (Back button & Add stop pill)
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
                      _destSearchCtrl.clear();
                      setState(() {
                        _isSearchExpanded = false;
                        _searchResults = [];
                      });
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

          // 3. Sliding Ride Selection Bottom Sheet (Matching user screenshot)
          Align(
            alignment: Alignment.bottomCenter,
            child: _buildRideSelectionBottomSheet(bookingState),
          ),
        ],
      ),
    );
  }

  Widget _buildRideSelectionBottomSheet(RiderBookingState bookingState) {
    final dropTime = _getDropTimeEstimate(bookingState);

    final rideOptions = [
      {
        'id': 'BIKE',
        'category': 'BIKE',
        'title': 'Bike',
        'subtitle': 'Quick Bike rides • 4 min away • Drop $dropTime • 👤 1',
        'price': _getOptionPrice('BIKE', bookingState),
        'icon': Icons.two_wheeler_rounded,
        'iconColor': const Color(0xFFF59E0B),
        'hasDiscountBadge': false,
        'hasPriorityBadge': false,
        'hasStarBadge': false,
        'isSurge': true,
        'buttonText': 'Bike',
      },
      {
        'id': 'AUTO',
        'category': 'AUTO',
        'title': 'Auto',
        'subtitle': '4 min away • Drop $dropTime • 👤 3',
        'price': _getOptionPrice('AUTO', bookingState),
        'icon': Icons.electric_rickshaw_rounded,
        'iconColor': const Color(0xFF10B981),
        'hasDiscountBadge': false,
        'hasPriorityBadge': false,
        'hasStarBadge': false,
        'isSurge': false,
        'buttonText': 'Auto',
      },
      {
        'id': 'AUTO_LITE',
        'category': 'AUTO',
        'title': 'Auto Lite',
        'subtitle': 'Pocket friendly • 4 min away • Drop $dropTime • 👤 3',
        'price': _getOptionPrice('AUTO', bookingState, multiplier: 0.88),
        'icon': Icons.electric_rickshaw_rounded,
        'iconColor': const Color(0xFF059669),
        'hasDiscountBadge': true,
        'hasPriorityBadge': false,
        'hasStarBadge': false,
        'isSurge': false,
        'buttonText': 'Auto Lite',
      },
      {
        'id': 'AUTO_PRIORITY',
        'category': 'AUTO',
        'title': 'Auto Priority',
        'subtitle': 'Fastest pickup • 2 min away • Drop $dropTime • 👤 3',
        'price': _getOptionPrice('AUTO', bookingState, multiplier: 1.10),
        'icon': Icons.electric_rickshaw_rounded,
        'iconColor': const Color(0xFF10B981),
        'hasDiscountBadge': false,
        'hasPriorityBadge': true,
        'hasStarBadge': false,
        'isSurge': false,
        'buttonText': 'Auto Priority',
      },
      {
        'id': 'MINI',
        'category': 'MINI',
        'title': 'Cab Economy',
        'subtitle': 'Hatchback • 4 min away • Drop $dropTime • 👤 4',
        'price': _getOptionPrice('MINI', bookingState),
        'icon': Icons.directions_car_filled_rounded,
        'iconColor': const Color(0xFF3B82F6),
        'hasDiscountBadge': false,
        'hasPriorityBadge': false,
        'hasStarBadge': false,
        'isSurge': false,
        'buttonText': 'Cab Economy',
      },
      {
        'id': 'SEDAN',
        'category': 'SEDAN',
        'title': 'Cab Premium',
        'subtitle': 'Prime sedan • 4 min away • Drop $dropTime • 👤 4',
        'price': _getOptionPrice('SEDAN', bookingState),
        'icon': Icons.directions_car_rounded,
        'iconColor': const Color(0xFF6366F1),
        'hasDiscountBadge': false,
        'hasPriorityBadge': false,
        'hasStarBadge': true,
        'isSurge': false,
        'buttonText': 'Cab Premium',
      },
      {
        'id': 'SUV',
        'category': 'SUV',
        'title': 'Spacious SUV',
        'subtitle': 'Extra legroom & luggage • 👤 6',
        'price': _getOptionPrice('SUV', bookingState),
        'icon': Icons.airport_shuttle_rounded,
        'iconColor': const Color(0xFF8B5CF6),
        'hasDiscountBadge': false,
        'hasPriorityBadge': false,
        'hasStarBadge': false,
        'isSurge': false,
        'buttonText': 'XL SUV',
      },
    ];

    final selectedOpt = rideOptions.firstWhere(
      (o) => o['id'] == _selectedRideOptionId,
      orElse: () => rideOptions.first,
    );

    return Container(
      height: MediaQuery.of(context).size.height * 0.58,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 18,
            spreadRadius: 2,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Drag Handle
          Center(
            child: Container(
              width: 44,
              height: 4,
              margin: const EdgeInsets.only(top: 10, bottom: 8),
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Scrollable Fleet List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 4),
              itemCount: rideOptions.length,
              itemBuilder: (context, index) {
                final opt = rideOptions[index];
                final isSelected = opt['id'] == _selectedRideOptionId;

                return _buildRideOptionCard(
                  id: opt['id'] as String,
                  title: opt['title'] as String,
                  subtitle: opt['subtitle'] as String,
                  price: opt['price'] as int,
                  icon: opt['icon'] as IconData,
                  iconColor: opt['iconColor'] as Color,
                  hasDiscountBadge: opt['hasDiscountBadge'] as bool,
                  hasPriorityBadge: opt['hasPriorityBadge'] as bool,
                  hasStarBadge: opt['hasStarBadge'] as bool,
                  isSurge: opt['isSurge'] as bool,
                  isSelected: isSelected,
                  onTap: () {
                    setState(() {
                      _selectedRideOptionId = opt['id'] as String;
                    });
                    ref
                        .read(riderBookingProvider.notifier)
                        .selectCategory(opt['category'] as String);
                  },
                );
              },
            ),
          ),

          // Payment & Offers Row
          _buildPaymentAndOffersRow(),

          // Big Confirm Yellow Button
          _buildBookRideButton(selectedOpt['buttonText'] as String),
        ],
      ),
    );
  }

  Widget _buildRideOptionCard({
    required String id,
    required String title,
    required String subtitle,
    required int price,
    required IconData icon,
    required Color iconColor,
    bool hasDiscountBadge = false,
    bool hasPriorityBadge = false,
    bool hasStarBadge = false,
    bool isSurge = false,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : const Color(0xFFFBFBFB),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? const Color(0xFF1E3A8A) : const Color(0xFFF1F5F9),
            width: isSelected ? 2.0 : 1.0,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF1E3A8A).withOpacity(0.08),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          children: [
            // Left Vehicle Icon with Badges
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: iconColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Icon(
                      icon,
                      size: 28,
                      color: iconColor,
                    ),
                  ),
                ),
                if (hasDiscountBadge)
                  Positioned(
                    top: -4,
                    left: -4,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                        color: Color(0xFF059669),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.percent_rounded,
                        size: 11,
                        color: Colors.white,
                      ),
                    ),
                  ),
                if (hasPriorityBadge)
                  Positioned(
                    top: -4,
                    left: -4,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                        color: Color(0xFFF59E0B),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.bolt_rounded,
                        size: 12,
                        color: Colors.white,
                      ),
                    ),
                  ),
                if (hasStarBadge)
                  Positioned(
                    top: -4,
                    right: -4,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                        color: Color(0xFFEAB308),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.star_rounded,
                        size: 11,
                        color: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 14),

            // Title & Subtitle Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Colors.grey.shade600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

            // Fare Price
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (isSurge)
                  const Text(
                    '↑ ',
                    style: TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                    ),
                  ),
                Text(
                  '₹$price',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Colors.black,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentAndOffersRow() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          // Left: Payment Method
          Expanded(
            child: InkWell(
              onTap: () {
                setState(() {
                  _selectedPaymentMethod =
                      _selectedPaymentMethod == 'CASH' ? 'ONLINE' : 'CASH';
                });
              },
              borderRadius: BorderRadius.circular(10),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
                child: Row(
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: const BoxDecoration(
                        color: Colors.black,
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.account_balance_wallet_rounded,
                          color: Color(0xFFFFC727),
                          size: 15,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  _selectedPaymentMethod == 'CASH'
                                      ? 'Cash on Drop'
                                      : 'RideNow Wallet',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.black,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const Icon(
                                Icons.keyboard_arrow_right_rounded,
                                size: 16,
                                color: Colors.black54,
                              ),
                            ],
                          ),
                          Text(
                            _selectedPaymentMethod == 'CASH'
                                ? 'Pay directly to driver'
                                : 'Low Balance: ₹0.0',
                            style: TextStyle(
                              fontSize: 11,
                              color: _selectedPaymentMethod == 'CASH'
                                  ? Colors.grey.shade600
                                  : Colors.red.shade700,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Divider
          Container(
            height: 26,
            width: 1,
            color: Colors.grey.shade300,
            margin: const EdgeInsets.symmetric(horizontal: 8),
          ),

          // Right: Offers
          InkWell(
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Offer "FIRST50" auto-applied! Save ₹50 on this ride.'),
                  backgroundColor: Color(0xFF059669),
                  duration: Duration(seconds: 2),
                ),
              );
            },
            borderRadius: BorderRadius.circular(10),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
              child: Row(
                children: const [
                  Icon(
                    Icons.local_offer_rounded,
                    color: Color(0xFF059669),
                    size: 20,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'Offers',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: Colors.black,
                    ),
                  ),
                  Icon(
                    Icons.keyboard_arrow_right_rounded,
                    size: 16,
                    color: Colors.black54,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookRideButton(String buttonTitle) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        16,
        6,
        16,
        MediaQuery.of(context).padding.bottom > 0
            ? MediaQuery.of(context).padding.bottom + 4
            : 16,
      ),
      child: SizedBox(
        height: 52,
        width: double.infinity,
        child: ElevatedButton(
          onPressed: _isBooking ? null : _confirmRideBooking,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFFFC727),
            foregroundColor: Colors.black,
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(26),
            ),
          ),
          child: _isBooking
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    color: Colors.black,
                    strokeWidth: 2.5,
                  ),
                )
              : Text(
                  'Book $buttonTitle',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Colors.black,
                    letterSpacing: 0.2,
                  ),
                ),
        ),
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
              content: Text(
                errorMsg != null && errorMsg.isNotEmpty
                    ? 'Booking failed: $errorMsg'
                    : 'Ride booking failed. Please verify your connection.',
              ),
              backgroundColor: Colors.red[700],
              duration: const Duration(seconds: 4),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isBooking = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error booking ride: $e'),
            backgroundColor: Colors.red[700],
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  int _getOptionPrice(
    String cat,
    RiderBookingState state, {
    double multiplier = 1.0,
  }) {
    final distance = state.route?.distanceKm ?? 5.2;
    if (state.fareEstimates.isNotEmpty) {
      final est = state.fareEstimates.firstWhere(
        (e) => (e['category'] as String?)?.toUpperCase() == cat.toUpperCase(),
        orElse: () => {},
      );
      if (est['totalFare'] != null) {
        final base = (est['totalFare'] as num).toDouble();
        return math.max(25, (base * multiplier).round());
      }
    }

    switch (cat.toUpperCase()) {
      case 'BIKE':
        return math.max(25, (20.0 + (distance * 8.0) + 2.0) * multiplier).round();
      case 'AUTO':
        return math.max(40, (30.0 + (distance * 12.0) + 3.0) * multiplier).round();
      case 'MINI':
        return math.max(70, (50.0 + (distance * 14.0) + 4.0) * multiplier).round();
      case 'SEDAN':
        return math.max(100, (75.0 + (distance * 17.0) + 5.0) * multiplier).round();
      case 'SUV':
        return math.max(140, (100.0 + (distance * 21.0) + 6.0) * multiplier).round();
      default:
        return math.max(50, (40.0 + (distance * 12.0)) * multiplier).round();
    }
  }

  String _getDropTimeEstimate(RiderBookingState state) {
    final durationMinutes = state.route?.durationMinutes ?? 18.0;
    final arrival =
        DateTime.now().add(Duration(minutes: durationMinutes.round() + 4));
    final hour = arrival.hour > 12
        ? arrival.hour - 12
        : (arrival.hour == 0 ? 12 : arrival.hour);
    final minute = arrival.minute.toString().padLeft(2, '0');
    final ampm = arrival.hour >= 12 ? 'pm' : 'am';
    return '$hour:$minute $ampm';
  }

  Widget _buildSearchCategoryChip(
    String cat,
    String label,
    IconData icon,
    bool isSelected,
  ) {
    return ChoiceChip(
      selected: isSelected,
      onSelected: (_) {
        ref.read(riderBookingProvider.notifier).selectCategory(cat);
      },
      avatar: Icon(
        icon,
        size: 16,
        color: isSelected ? Colors.black : Colors.grey[700],
      ),
      label: Text(
        label,
        style: TextStyle(
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
          color: isSelected ? Colors.black : Colors.black87,
          fontSize: 12,
        ),
      ),
      selectedColor: const Color(0xFFFFC727),
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: isSelected ? const Color(0xFFFFC727) : const Color(0xFFCBD5E1),
          width: isSelected ? 1.5 : 1,
        ),
      ),
    );
  }
}
