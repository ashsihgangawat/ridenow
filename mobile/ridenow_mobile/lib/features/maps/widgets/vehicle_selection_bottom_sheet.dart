import 'package:flutter/material.dart';
import '../../rider/providers/rider_booking_provider.dart';

class VehicleSelectionBottomSheet extends StatelessWidget {
  final RiderBookingState bookingState;
  final String selectedOptionId;
  final String selectedPaymentMethod;
  final bool isBooking;
  final Function(String optionId, String category) onSelectOption;
  final VoidCallback onTogglePaymentMethod;
  final VoidCallback onApplyCoupon;
  final VoidCallback onConfirmBooking;

  const VehicleSelectionBottomSheet({
    super.key,
    required this.bookingState,
    required this.selectedOptionId,
    required this.selectedPaymentMethod,
    required this.isBooking,
    required this.onSelectOption,
    required this.onTogglePaymentMethod,
    required this.onApplyCoupon,
    required this.onConfirmBooking,
  });

  String _getDropTimeEstimate() {
    final now = DateTime.now();
    int durationMin = 18;
    if (bookingState.route != null && bookingState.route!.durationMinutes > 0) {
      durationMin = bookingState.route!.durationMinutes.round();
    }
    final arrival = now.add(Duration(minutes: durationMin));
    final hour = arrival.hour % 12 == 0 ? 12 : arrival.hour % 12;
    final min = arrival.minute.toString().padLeft(2, '0');
    final period = arrival.hour >= 12 ? 'pm' : 'am';
    return '$hour:$min $period';
  }

  int _getOptionPrice(String cat, {double multiplier = 1.0}) {
    final estimate = bookingState.fareEstimates.firstWhere(
      (e) => e['category'] == cat,
      orElse: () => <String, dynamic>{},
    );
    if (estimate.isNotEmpty && estimate['totalFare'] != null) {
      final base = (estimate['totalFare'] as num).toDouble();
      return (base * multiplier).round();
    }
    final km = (bookingState.route?.distanceKm ?? 6.5).clamp(1.0, 50.0);
    switch (cat) {
      case 'BIKE':
        return ((30.0 + (km * 12.0)) * multiplier).round();
      case 'AUTO':
        return ((40.0 + (km * 15.0)) * multiplier).round();
      case 'MINI':
        return ((60.0 + (km * 18.0)) * multiplier).round();
      case 'SEDAN':
        return ((80.0 + (km * 22.0)) * multiplier).round();
      case 'SUV':
        return ((120.0 + (km * 30.0)) * multiplier).round();
      default:
        return 50;
    }
  }

  @override
  Widget build(BuildContext context) {
    final dropTime = _getDropTimeEstimate();

    final rideOptions = [
      {
        'id': 'BIKE',
        'category': 'BIKE',
        'title': 'Bike',
        'subtitle': '4 min away • Drop $dropTime • 👤 1',
        'price': _getOptionPrice('BIKE'),
        'icon': Icons.two_wheeler_rounded,
        'iconColor': const Color(0xFFF59E0B),
        'hasDiscountBadge': false,
        'hasPriorityBadge': false,
        'isSurge': true,
        'buttonText': 'Bike',
      },
      {
        'id': 'AUTO',
        'category': 'AUTO',
        'title': 'Auto',
        'subtitle': '4 min away • Drop $dropTime • 👤 3',
        'price': _getOptionPrice('AUTO'),
        'icon': Icons.electric_rickshaw_rounded,
        'iconColor': const Color(0xFF10B981),
        'hasDiscountBadge': false,
        'hasPriorityBadge': false,
        'isSurge': false,
        'buttonText': 'Auto',
      },
      {
        'id': 'AUTO_LITE',
        'category': 'AUTO',
        'title': 'Auto Lite',
        'subtitle': 'Economy • 4 min away • Drop $dropTime • 👤 3',
        'price': _getOptionPrice('AUTO', multiplier: 0.88),
        'icon': Icons.electric_rickshaw_rounded,
        'iconColor': const Color(0xFF059669),
        'hasDiscountBadge': true,
        'hasPriorityBadge': false,
        'isSurge': false,
        'buttonText': 'Auto Lite',
      },
      {
        'id': 'AUTO_PRIORITY',
        'category': 'AUTO',
        'title': 'Auto Priority',
        'subtitle': 'Fastest • 2 min away • Drop $dropTime • 👤 3',
        'price': _getOptionPrice('AUTO', multiplier: 1.10),
        'icon': Icons.electric_rickshaw_rounded,
        'iconColor': const Color(0xFF10B981),
        'hasDiscountBadge': false,
        'hasPriorityBadge': true,
        'isSurge': false,
        'buttonText': 'Auto Priority',
      },
      {
        'id': 'MINI',
        'category': 'MINI',
        'title': 'Cab Economy',
        'subtitle': 'Hatchback • 4 min away • Drop $dropTime • 👤 4',
        'price': _getOptionPrice('MINI'),
        'icon': Icons.directions_car_filled_rounded,
        'iconColor': const Color(0xFF3B82F6),
        'hasDiscountBadge': false,
        'hasPriorityBadge': false,
        'isSurge': false,
        'buttonText': 'Cab Economy',
      },
      {
        'id': 'SEDAN',
        'category': 'SEDAN',
        'title': 'Cab Premium',
        'subtitle': 'Prime sedan • 4 min away • Drop $dropTime • 👤 4',
        'price': _getOptionPrice('SEDAN'),
        'icon': Icons.directions_car_rounded,
        'iconColor': const Color(0xFF6366F1),
        'hasDiscountBadge': false,
        'hasPriorityBadge': false,
        'isSurge': false,
        'buttonText': 'Cab Premium',
      },
      {
        'id': 'SUV',
        'category': 'SUV',
        'title': 'Spacious SUV',
        'subtitle': 'Spacious 6-seater • Drop $dropTime • 👤 6',
        'price': _getOptionPrice('SUV'),
        'icon': Icons.airport_shuttle_rounded,
        'iconColor': const Color(0xFF8B5CF6),
        'hasDiscountBadge': false,
        'hasPriorityBadge': false,
        'isSurge': false,
        'buttonText': 'XL SUV',
      },
    ];

    final selectedOpt = rideOptions.firstWhere(
      (o) => o['id'] == selectedOptionId,
      orElse: () => rideOptions.first,
    );

    return Container(
      height: MediaQuery.of(context).size.height * 0.62,
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
                final isSelected = opt['id'] == selectedOptionId;

                return GestureDetector(
                  onTap: () => onSelectOption(
                    opt['id'] as String,
                    opt['category'] as String,
                  ),
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
                        // Left Vehicle Icon
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: (opt['iconColor'] as Color).withOpacity(0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Center(
                            child: Icon(
                              opt['icon'] as IconData,
                              size: 28,
                              color: opt['iconColor'] as Color,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),

                        // Title & Subtitle Details
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                opt['title'] as String,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.black87,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                opt['subtitle'] as String,
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
                            if (opt['isSurge'] == true)
                              const Text(
                                '↑ ',
                                style: TextStyle(
                                  color: Colors.red,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 14,
                                ),
                              ),
                            Text(
                              '₹${opt['price']}',
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
              },
            ),
          ),

          // Payment & Offers Row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                // Payment Method
                Expanded(
                  child: InkWell(
                    onTap: onTogglePaymentMethod,
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
                                        selectedPaymentMethod == 'CASH'
                                            ? 'Cash on Drop'
                                            : 'RideNow Wallet',
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w800,
                                          color: Colors.black,
                                        ),
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
                                  selectedPaymentMethod == 'CASH'
                                      ? 'Pay directly to driver'
                                      : 'Instant digital balance',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.grey.shade600,
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

                // Vertical Divider
                Container(
                  height: 24,
                  width: 1,
                  color: Colors.grey.shade300,
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                ),

                // Offers Pill
                InkWell(
                  onTap: onApplyCoupon,
                  borderRadius: BorderRadius.circular(10),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                    child: Row(
                      children: const [
                        Icon(Icons.local_offer_rounded, color: Color(0xFF059669), size: 18),
                        SizedBox(width: 6),
                        Text(
                          'Offers',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.black),
                        ),
                        Icon(Icons.keyboard_arrow_right_rounded, size: 16, color: Colors.black54),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Big Confirm Yellow Button
          SafeArea(
            top: false,
            bottom: true,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 6, 16, 12),
              child: SizedBox(
                height: 52,
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isBooking ? null : onConfirmBooking,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFFC727),
                    foregroundColor: Colors.black,
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(26),
                    ),
                  ),
                  child: isBooking
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2.5),
                        )
                      : Text(
                          'Book ${selectedOpt['buttonText']}',
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.3,
                          ),
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
