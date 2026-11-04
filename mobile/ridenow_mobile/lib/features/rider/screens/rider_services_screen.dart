import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/rider_booking_provider.dart';

class RiderServicesScreen extends ConsumerWidget {
  final Function(String serviceName, String category)? onServiceSelected;

  const RiderServicesScreen({
    super.key,
    this.onServiceSelected,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        bottom: true,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Header
              const Text(
                'Services',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Go anywhere, get anything',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 20),

              // 2. Row 1: Two Large Cards (Bike Saver & Auto)
              Row(
                children: [
                  Expanded(
                    child: _buildServiceCard(
                      title: 'Bike Saver',
                      icon: Icons.two_wheeler,
                      iconColor: const Color(0xFFF59E0B),
                      height: 125,
                      onTap: () {
                        ref
                            .read(riderBookingProvider.notifier)
                            .selectCategory('BIKE');
                        onServiceSelected?.call('Bike Saver', 'BIKE');
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildServiceCard(
                      title: 'Auto',
                      icon: Icons.electric_rickshaw,
                      iconColor: const Color(0xFF10B981),
                      height: 125,
                      onTap: () {
                        ref
                            .read(riderBookingProvider.notifier)
                            .selectCategory('AUTO');
                        onServiceSelected?.call('Auto', 'AUTO');
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // 3. Row 2: Three Medium Cards (Trip, Rentals, Intercity)
              Row(
                children: [
                  Expanded(
                    child: _buildServiceCard(
                      title: 'Trip',
                      icon: Icons.directions_car_filled,
                      iconColor: const Color(0xFF3B82F6),
                      height: 110,
                      onTap: () {
                        ref
                            .read(riderBookingProvider.notifier)
                            .selectCategory('MINI');
                        onServiceSelected?.call('Trip', 'MINI');
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildServiceCard(
                      title: 'Rentals',
                      icon: Icons.access_time_filled_rounded,
                      iconColor: const Color(0xFF64748B),
                      height: 110,
                      onTap: () {
                        ref
                            .read(riderBookingProvider.notifier)
                            .selectCategory('SEDAN');
                        onServiceSelected?.call('Rentals', 'SEDAN');
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildServiceCard(
                      title: 'Intercity',
                      icon: Icons.luggage_rounded,
                      iconColor: const Color(0xFF8B5CF6),
                      height: 110,
                      onTap: () {
                        ref
                            .read(riderBookingProvider.notifier)
                            .selectCategory('SUV');
                        onServiceSelected?.call('Intercity', 'SUV');
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // 4. Row 3: Four Square Cards (Parcel, Reserve, Teens, Seniors)
              Row(
                children: [
                  Expanded(
                    child: _buildServiceCard(
                      title: 'Parcel',
                      icon: Icons.inventory_2_rounded,
                      iconColor: const Color(0xFFF97316),
                      height: 100,
                      isSmall: true,
                      onTap: () {
                        onServiceSelected?.call('Parcel', 'BIKE');
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildServiceCard(
                      title: 'Reserve',
                      icon: Icons.event_available_rounded,
                      iconColor: const Color(0xFF6366F1),
                      badgeText: 'Promo',
                      height: 100,
                      isSmall: true,
                      onTap: () {
                        onServiceSelected?.call('Reserve', 'AUTO');
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildServiceCard(
                      title: 'Teens',
                      icon: Icons.backpack_rounded,
                      iconColor: const Color(0xFF06B6D4),
                      height: 100,
                      isSmall: true,
                      onTap: () {
                        onServiceSelected?.call('Teens', 'AUTO');
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildServiceCard(
                      title: 'Seniors',
                      icon: Icons.assist_walker_rounded,
                      iconColor: const Color(0xFFEC4899),
                      height: 100,
                      isSmall: true,
                      onTap: () {
                        onServiceSelected?.call('Seniors', 'SEDAN');
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildServiceCard({
    required String title,
    required IconData icon,
    required Color iconColor,
    String? badgeText,
    IconData? badgeIcon,
    required double height,
    bool isSmall = false,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Stack(
          children: [
            // Badge (if any)
            if (badgeText != null)
              Positioned(
                top: 8,
                left: isSmall ? null : 8,
                right: isSmall ? 6 : null,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDC2626),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (badgeIcon != null) ...[
                        Icon(badgeIcon, color: Colors.white, size: 9),
                        const SizedBox(width: 2),
                      ],
                      Text(
                        badgeText,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // Icon
            Positioned(
              top: badgeText != null ? 24 : 14,
              left: isSmall ? 0 : null,
              right: isSmall ? 0 : 12,
              child: Center(
                child: Container(
                  width: isSmall ? 38 : 46,
                  height: isSmall ? 38 : 46,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(
                    icon,
                    color: iconColor,
                    size: isSmall ? 22 : 28,
                  ),
                ),
              ),
            ),

            // Title Label
            Positioned(
              bottom: 10,
              left: 10,
              right: 10,
              child: Text(
                title,
                textAlign: isSmall ? TextAlign.center : TextAlign.start,
                style: TextStyle(
                  fontSize: isSmall ? 11 : 13,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF0F172A),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
