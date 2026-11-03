import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/network/api_endpoints.dart';
import '../../auth/providers/auth_provider.dart';

class RiderHistoryScreen extends ConsumerStatefulWidget {
  const RiderHistoryScreen({super.key});

  @override
  ConsumerState<RiderHistoryScreen> createState() => _RiderHistoryScreenState();
}

class _RiderHistoryScreenState extends ConsumerState<RiderHistoryScreen> {
  List<dynamic> _rides = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.get(ApiEndpoints.rideHistory);
      if (res.data['success'] == true && res.data['rides'] is List) {
        setState(() {
          _rides = res.data['rides'];
          _loading = false;
        });
      }
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Activity'),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => context.pop(),
              )
            : null,
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primaryYellow),
            )
          : _rides.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.history_toggle_off,
                    color: AppTheme.textMuted,
                    size: 54,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'No ride history found',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Book your first ride on RideNow today.',
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () => context.go('/rider/home'),
                    child: const Text('Book a Ride'),
                  ),
                ],
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
              itemCount: _rides.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, i) {
                final r = _rides[i];
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceDark,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppTheme.borderSubtle),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '#${r['bookingCode'] ?? 'RN-0000'}',
                            style: const TextStyle(
                              color: AppTheme.primaryYellow,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: r['status'] == 'COMPLETED'
                                  ? AppTheme.successGreen.withOpacity(0.15)
                                  : Colors.amber.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              r['status'] ?? 'COMPLETED',
                              style: TextStyle(
                                color: r['status'] == 'COMPLETED'
                                    ? AppTheme.successGreen
                                    : Colors.amber,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          const Icon(
                            Icons.circle,
                            color: Colors.cyanAccent,
                            size: 8,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              r['pickupAddress'] ?? 'Pickup',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(
                            Icons.square,
                            color: AppTheme.primaryYellow,
                            size: 8,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              r['dropAddress'] ?? 'Destination',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${r['distanceKm'] ?? 3.5} km • ${r['vehicleCategory'] ?? 'AUTO'}',
                            style: const TextStyle(
                              color: AppTheme.textMuted,
                              fontSize: 11,
                            ),
                          ),
                          Text(
                            '₹${r['totalFare'] ?? 75.0}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
