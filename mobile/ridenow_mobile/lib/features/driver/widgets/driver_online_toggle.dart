import 'package:flutter/material.dart';
import '../../../app/theme/app_theme.dart';

class DriverOnlineToggle extends StatelessWidget {
  final bool isOnline;
  final bool isApproved;
  final bool isLoading;
  final String? verificationStatus;
  final VoidCallback onToggle;
  final VoidCallback onVerifyTapped;

  const DriverOnlineToggle({
    super.key,
    required this.isOnline,
    required this.isApproved,
    required this.isLoading,
    this.verificationStatus,
    required this.onToggle,
    required this.onVerifyTapped,
  });

  @override
  Widget build(BuildContext context) {
    if (!isApproved) {
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFF59E0B), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: Color(0x33F59E0B),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.verified_user_rounded, color: Color(0xFFF59E0B), size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Status: ${verificationStatus ?? "PENDING"}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Upload KYC documents to go online and receive rides.',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                  ),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: onVerifyTapped,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFFC727),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('Verify', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
            ),
          ],
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isOnline ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isOnline ? const Color(0xFF10B981) : Colors.grey.shade300,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: isOnline ? const Color(0xFF10B981).withOpacity(0.25) : Colors.black12,
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          // Status Pulse Indicator
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: isOnline ? const Color(0xFF10B981) : Colors.grey.shade400,
              shape: BoxShape.circle,
              boxShadow: isOnline
                  ? [
                      BoxShadow(
                        color: const Color(0xFF10B981).withOpacity(0.8),
                        blurRadius: 6,
                        spreadRadius: 1,
                      ),
                    ]
                  : null,
            ),
          ),
          const SizedBox(width: 12),

          // Status Text
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  isOnline ? 'ONLINE • ACCEPTING TRIPS' : 'OFFLINE',
                  style: TextStyle(
                    color: isOnline ? Colors.white : Colors.black87,
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                    letterSpacing: 0.3,
                  ),
                ),
                Text(
                  isOnline ? 'Broadcasting live GPS to nearby riders' : 'Go online to receive nearby ride requests',
                  style: TextStyle(
                    color: isOnline ? const Color(0xFF94A3B8) : Colors.grey.shade600,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),

          // Action Button
          ElevatedButton(
            onPressed: isLoading ? null : onToggle,
            style: ElevatedButton.styleFrom(
              backgroundColor: isOnline ? const Color(0xFFEF4444) : const Color(0xFFFFC727),
              foregroundColor: isOnline ? Colors.white : Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              elevation: 2,
            ),
            child: isLoading
                ? SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: isOnline ? Colors.white : Colors.black,
                    ),
                  )
                : Text(
                    isOnline ? 'Go Offline' : 'Go Online',
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
                  ),
          ),
        ],
      ),
    );
  }
}

