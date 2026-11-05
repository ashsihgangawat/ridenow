import 'package:flutter/material.dart';
import '../../rider/models/ride_model.dart';

class DriverActiveRideSheet extends StatelessWidget {
  final RideModel ride;
  final TextEditingController otpController;
  final bool isSimulating;
  final VoidCallback onChatTapped;
  final VoidCallback onSimulationToggled;
  final VoidCallback onMarkArrived;
  final VoidCallback onStartTrip;
  final VoidCallback onCompleteTrip;

  const DriverActiveRideSheet({
    super.key,
    required this.ride,
    required this.otpController,
    required this.isSimulating,
    required this.onChatTapped,
    required this.onSimulationToggled,
    required this.onMarkArrived,
    required this.onStartTrip,
    required this.onCompleteTrip,
  });

  @override
  Widget build(BuildContext context) {
    final status = ride.status;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: const Border(
          top: BorderSide(color: Color(0xFFFFC727), width: 1.5),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.8),
            blurRadius: 25,
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
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header Row: Booking code + Status badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'ACTIVE TRIP DISPATCH',
                    style: TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                  Text(
                    '#${ride.bookingCode}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 17,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFC727).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  status,
                  style: const TextStyle(
                    color: Color(0xFFFFC727),
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Addresses Information
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.06),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.my_location_rounded, size: 14, color: Color(0xFF10B981)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        ride.pickupAddress,
                        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.location_on_rounded, size: 14, color: Color(0xFFEF4444)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        ride.dropAddress,
                        style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Communication & Tools Row
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onChatTapped,
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFFFC727)),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFFFFC727), size: 16),
                  label: const Text(
                    'Chat with Rider',
                    style: TextStyle(color: Color(0xFFFFC727), fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton.icon(
                onPressed: onSimulationToggled,
                style: OutlinedButton.styleFrom(
                  side: BorderSide(
                    color: isSimulating ? const Color(0xFFEF4444) : const Color(0xFF94A3B8),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: Icon(
                  isSimulating ? Icons.stop_circle_rounded : Icons.play_arrow_rounded,
                  color: isSimulating ? const Color(0xFFEF4444) : Colors.white70,
                  size: 16,
                ),
                label: Text(
                  isSimulating ? 'Stop Drive' : 'Simulate',
                  style: TextStyle(
                    color: isSimulating ? const Color(0xFFEF4444) : Colors.white70,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Action Button based on Trip Status
          if (status == 'ACCEPTED')
            ElevatedButton.icon(
              onPressed: onMarkArrived,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              icon: const Icon(Icons.check_circle_outline_rounded),
              label: const Text(
                'I Have Arrived at Pickup',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
              ),
            )
          else if (status == 'ARRIVED') ...[
            TextField(
              controller: otpController,
              keyboardType: TextInputType.number,
              maxLength: 4,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFFFFC727),
                fontSize: 24,
                fontWeight: FontWeight.w900,
                letterSpacing: 6,
              ),
              decoration: InputDecoration(
                hintText: 'Enter 4-Digit Rider PIN',
                hintStyle: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 14,
                  letterSpacing: 1,
                ),
                counterText: '',
                filled: true,
                fillColor: Colors.white.withOpacity(0.08),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: Color(0xFFFFC727)),
                ),
              ),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: onStartTrip,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFFC727),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text(
                'Verify PIN & Start Trip',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
              ),
            ),
          ] else if (status == 'IN_PROGRESS')
            ElevatedButton.icon(
              onPressed: onCompleteTrip,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              icon: const Icon(Icons.check_circle_rounded),
              label: Text(
                'Complete Trip (Collect ₹${ride.totalFare})',
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
              ),
            ),
        ],
      ),
    );
  }
}

