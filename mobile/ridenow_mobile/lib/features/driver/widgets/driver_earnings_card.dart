import 'package:flutter/material.dart';

class DriverEarningsCard extends StatelessWidget {
  final String driverName;
  final double rating;
  final int totalTrips;
  final double walletBalance;
  final VoidCallback onProfileTap;
  final VoidCallback onVerificationTap;

  const DriverEarningsCard({
    super.key,
    required this.driverName,
    required this.rating,
    required this.totalTrips,
    required this.walletBalance,
    required this.onProfileTap,
    required this.onVerificationTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A).withOpacity(0.95),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0x33FFC727), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.35),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header Row: Driver Name + Profile link
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: const BoxDecoration(
                  color: Color(0xFFFFC727),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(Icons.sports_motorsports_rounded, color: Colors.black, size: 20),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      driverName.isNotEmpty ? driverName : 'Driver Partner',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Text(
                      'RideNow Certified Partner',
                      style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                    ),
                  ],
                ),
              ),
              InkWell(
                onTap: onProfileTap,
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Text(
                        'Profile',
                        style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                      SizedBox(width: 2),
                      Icon(Icons.chevron_right_rounded, size: 14, color: Colors.white70),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Divider(height: 1, color: Color(0x22FFFFFF)),
          const SizedBox(height: 10),

          // Metrics Row (Rating, Trips, Wallet Balance)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildMetric('★ ${rating.toStringAsFixed(1)}', 'Rating', const Color(0xFFFFC727)),
              Container(height: 24, width: 1, color: const Color(0x22FFFFFF)),
              _buildMetric('$totalTrips', 'Trips Done', Colors.white),
              Container(height: 24, width: 1, color: const Color(0x22FFFFFF)),
              _buildMetric('₹${walletBalance.toStringAsFixed(0)}', 'Wallet Balance', const Color(0xFF10B981)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetric(String value, String label, Color valueColor) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            color: valueColor,
            fontWeight: FontWeight.w900,
            fontSize: 15,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF94A3B8),
            fontSize: 10,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

