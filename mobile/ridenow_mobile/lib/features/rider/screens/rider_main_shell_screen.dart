import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/floating_bottom_nav_bar.dart';
import 'rider_home_screen.dart';
import 'rider_services_screen.dart';
import 'rider_history_screen.dart';
import 'rider_profile_screen.dart';
import '../providers/rider_booking_provider.dart';

class RiderMainShellScreen extends ConsumerStatefulWidget {
  final int initialTab;
  const RiderMainShellScreen({super.key, this.initialTab = 0});

  @override
  ConsumerState<RiderMainShellScreen> createState() =>
      _RiderMainShellScreenState();
}

class _RiderMainShellScreenState extends ConsumerState<RiderMainShellScreen> {
  late int _currentTabIndex;

  @override
  void initState() {
    super.initState();
    _currentTabIndex = widget.initialTab;
  }

  void _onTabTapped(int index) {
    setState(() {
      _currentTabIndex = index;
    });
  }

  void _handleServiceSelected(String serviceName, String category) {
    ref.read(riderBookingProvider.notifier).selectCategory(category);
    setState(() {
      _currentTabIndex = 0; // Switch to Home tab
    });
  }

  @override
  Widget build(BuildContext context) {
    final bookingState = ref.watch(riderBookingProvider);
    final isBookingFlow = bookingState.dropPoint != null;

    return Scaffold(
      backgroundColor: Colors.white,
      extendBody: !isBookingFlow, // Only extend when floating pill navbar is visible
      body: IndexedStack(
        index: _currentTabIndex,
        children: [
          RiderHomeScreen(
            onNavigateToServices: () => setState(() => _currentTabIndex = 1),
            onNavigateToActivity: () => setState(() => _currentTabIndex = 2),
            onNavigateToAccount: () => setState(() => _currentTabIndex = 3),
          ),
          RiderServicesScreen(
            onServiceSelected: _handleServiceSelected,
          ),
          const RiderHistoryScreen(),
          const RiderProfileScreen(),
        ],
      ),
      bottomNavigationBar: isBookingFlow
          ? null
          : SafeArea(
              top: false,
              left: false,
              right: false,
              bottom: true,
              child: FloatingBottomNavBar(
                currentIndex: _currentTabIndex,
                onTap: _onTabTapped,
              ),
            ),
    );
  }
}
