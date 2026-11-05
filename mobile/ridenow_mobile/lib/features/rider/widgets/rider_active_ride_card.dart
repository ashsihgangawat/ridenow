import 'package:flutter/material.dart';
import '../models/ride_model.dart';

class RiderActiveRideCard extends StatelessWidget {
  final RideModel ride;
  final VoidCallback onChat;
  final VoidCallback onCall;
  final VoidCallback onCancel;
  final VoidCallback onSos;

  const RiderActiveRideCard({
    super.key,
    required this.ride,
    required this.onChat,
    required this.onCall,
    required this.onCancel,
    required this.onSos,
  });

  @override
  Widget build(BuildContext context) {
    final status = ride.status;
    final driver = ride.driver;
    final driverName = driver?['fullName'] ?? driver?['user']?['fullName'] ?? driver?['name'] ?? 'Assigned Partner';
    final vehicleModel = driver?['vehicleModel'] ?? driver?['vehicle']?['model'] ?? ride.vehicleCategory;
    final vehicleNumber = driver?['vehicleNumber'] ?? driver?['vehicle']?['plateNumber'] ?? '';
    final driverRating = driver?['rating'] ?? 4.9;
    final otp = ride.otp.isNotEmpty ? ride.otp : '----';

    String statusText = 'Driver Assigned & Heading to Pickup';
    Color statusColor = const Color(0xFF2563EB);
    if (status == 'ARRIVED') {
      statusText = 'Driver Has Arrived at Pickup Point!';
      statusColor = const Color(0xFF10B981);
    } else if (status == 'IN_PROGRESS') {
      statusText = 'Trip In Progress to Destination';
      statusColor = const Color(0xFFFFC727);
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.18),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Status Banner + 4-digit PIN Box
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: statusColor,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        statusText,
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.w900,
                          fontSize: 13,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              // Prominent OTP PIN Box
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFFC727), width: 1.5),
                ),
                child: Column(
                  children: [
                    const Text(
                      'START PIN',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFFB45309),
                      ),
                    ),
                    Text(
                      otp,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Colors.black,
                        letterSpacing: 2,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Driver & Vehicle Card
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                // Vehicle / Driver Avatar
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Icon(
                      ride.vehicleCategory == 'BIKE'
                          ? Icons.two_wheeler_rounded
                          : ride.vehicleCategory == 'AUTO'
                              ? Icons.electric_rickshaw_rounded
                              : Icons.directions_car_filled_rounded,
                      color: const Color(0xFFFFC727),
                      size: 28,
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Driver details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        driverName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 15,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        vehicleNumber.isNotEmpty ? '$vehicleModel • $vehicleNumber' : '$vehicleModel',
                        style: TextStyle(
                          color: Colors.grey.shade700,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.star_rounded, size: 14, color: Color(0xFFF59E0B)),
                          const SizedBox(width: 2),
                          Text(
                            '$driverRating • Verified Partner',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Communication Action Buttons: Call & Chat
                Row(
                  children: [
                    IconButton(
                      onPressed: onCall,
                      icon: const Icon(Icons.call_rounded, color: Color(0xFF10B981)),
                      style: IconButton.styleFrom(
                        backgroundColor: const Color(0xFFECFDF5),
                      ),
                      tooltip: 'Call Driver',
                    ),
                    const SizedBox(width: 4),
                    IconButton(
                      onPressed: onChat,
                      icon: const Icon(Icons.chat_bubble_rounded, color: Color(0xFF2563EB)),
                      style: IconButton.styleFrom(
                        backgroundColor: const Color(0xFFEFF6FF),
                      ),
                      tooltip: 'Chat with Driver',
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Fare & Emergency Actions Row
          Row(
            children: [
              Expanded(
                child: Text(
                  '₹${ride.totalFare} • Cash on Drop',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    color: Colors.black,
                  ),
                ),
              ),
              // Emergency SOS Button
              TextButton.icon(
                onPressed: onSos,
                icon: const Icon(Icons.shield_rounded, size: 16, color: Color(0xFFEF4444)),
                label: const Text(
                  'SOS',
                  style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
              const SizedBox(width: 4),
              // Cancel Ride Button
              if (status == 'REQUESTED' || status == 'ACCEPTED')
                OutlinedButton(
                  onPressed: onCancel,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFEF4444),
                    side: const BorderSide(color: Color(0xFFEF4444)),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
