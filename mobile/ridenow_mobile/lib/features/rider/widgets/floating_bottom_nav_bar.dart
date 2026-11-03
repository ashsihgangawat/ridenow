import 'package:flutter/material.dart';

class FloatingBottomNavBar extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const FloatingBottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return Container(
      color: Colors.transparent,
      padding: EdgeInsets.only(
        left: 18,
        right: 18,
        bottom: bottomInset > 0 ? bottomInset + 6 : 18,
      ),
      child: Container(
        height: 68,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(38),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.09),
              blurRadius: 24,
              spreadRadius: 1,
              offset: const Offset(0, 6),
            ),
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 6,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavItem(
              index: 0,
              label: 'Home',
              icon: Icons.home_rounded,
              isSelected: currentIndex == 0,
            ),
            _buildNavItem(
              index: 1,
              label: 'Services',
              icon: Icons.grid_view_rounded,
              isSelected: currentIndex == 1,
            ),
            _buildNavItem(
              index: 2,
              label: 'Activity',
              icon: Icons.receipt_long_rounded,
              isSelected: currentIndex == 2,
            ),
            _buildNavItem(
              index: 3,
              label: 'Account',
              icon: Icons.person_outline_rounded,
              isSelected: currentIndex == 3,
              hasNotificationBadge: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required String label,
    required IconData icon,
    required bool isSelected,
    bool hasNotificationBadge = false,
  }) {
    return GestureDetector(
      onTap: () => onTap(index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFF1F3F5) : Colors.transparent,
          borderRadius: BorderRadius.circular(28),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.center,
              children: [
                Icon(
                  icon,
                  size: 22,
                  color: isSelected ? Colors.black : const Color(0xFF555555),
                ),
                if (hasNotificationBadge)
                  Positioned(
                    top: -1,
                    right: -4,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFFE53935),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 11.5,
                letterSpacing: -0.2,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                color: isSelected ? Colors.black : const Color(0xFF555555),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
