import 'package:flutter/material.dart';

class IncomingRideRequestSheet extends StatelessWidget {
  final Map<String, dynamic> request;
  final int countdownSeconds;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  const IncomingRideRequestSheet({
    super.key,
    required this.request,
    required this.countdownSeconds,
    required this.onAccept,
    required this.onDecline,
  });

  @override
  Widget build(BuildContext context) {
    final earnings = (request['driverEarnings'] ?? request['totalFare'] ?? 75.0);
    final totalFare = (request['totalFare'] ?? earnings);
    final vehicleCat = (request['vehicleCategory'] ?? 'AUTO').toString().toUpperCase();
    final pickup = request['pickupAddress'] ?? 'Pickup location';
    final drop = request['dropAddress'] ?? 'Destination';
    final distanceKm = request['distanceKm'] != null
        ? '${(request['distanceKm'] as num).toStringAsFixed(1)} km'
        : 'Approx. 5.0 km';

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFFFC727), width: 2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFFC727).withOpacity(0.35),
            blurRadius: 28,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Top Header: Badge + Countdown Timer
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFC727).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  'NEW $vehicleCat RIDE REQUEST',
                  style: const TextStyle(
                    color: Color(0xFFFFC727),
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              Row(
                children: [
                  const Icon(Icons.timer_outlined, color: Color(0xFFFFC727), size: 16),
                  const SizedBox(width: 4),
                  Text(
                    '${countdownSeconds}s',
                    style: const TextStyle(
                      color: Color(0xFFFFC727),
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Fare & Earnings Highlight
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                '₹$earnings',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '(Total ₹$totalFare • $distanceKm)',
                style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const Text(
            'Partner Net Earnings (Includes platform fees & taxes)',
            style: TextStyle(color: Color(0xFF64748B), fontSize: 11),
          ),
          const SizedBox(height: 16),

          // Route Addresses (Pickup -> Drop)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                // Pickup Row
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 3),
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: Color(0xFF10B981),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        pickup,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                Container(
                  margin: const EdgeInsets.only(left: 4),
                  height: 16,
                  width: 2,
                  color: Colors.white24,
                ),
                // Drop Row
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 3),
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: Color(0xFFEF4444),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        drop,
                        style: const TextStyle(
                          color: Color(0xFFCBD5E1),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Action Buttons: Decline & Accept
          Row(
            children: [
              Expanded(
                flex: 2,
                child: OutlinedButton(
                  onPressed: onDecline,
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.white24),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text(
                    'Decline',
                    style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 3,
                child: ElevatedButton(
                  onPressed: onAccept,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 3,
                  ),
                  child: const Text(
                    'Accept Ride',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

