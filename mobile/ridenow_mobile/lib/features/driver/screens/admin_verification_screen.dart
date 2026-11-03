import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/widgets/ridenow_logo.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/driver_verification_provider.dart';

class AdminVerificationScreen extends ConsumerStatefulWidget {
  const AdminVerificationScreen({super.key});

  @override
  ConsumerState<AdminVerificationScreen> createState() =>
      _AdminVerificationScreenState();
}

class _AdminVerificationScreenState
    extends ConsumerState<AdminVerificationScreen> {
  bool _isLoading = true;
  Map<String, dynamic> _stats = {
    'totalDrivers': 0,
    'pendingVerification': 0,
    'approvedDrivers': 0,
    'rejectedDrivers': 0,
    'suspendedDrivers': 0,
    'bikeDrivers': 0,
    'carDrivers': 0,
  };

  List<dynamic> _drivers = [];
  String _selectedFilter = 'PENDING'; // 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'

  @override
  void initState() {
    super.initState();
    _loadAdminData();
  }

  Future<void> _loadAdminData() async {
    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiClientProvider);

      // Load Stats
      final statsRes = await api.get(ApiEndpoints.adminVerificationStats);
      if (statsRes.data['success'] == true && statsRes.data['stats'] != null) {
        _stats = Map<String, dynamic>.from(statsRes.data['stats']);
      }

      // Load Pending / All Drivers
      final driversRes = await api.get(ApiEndpoints.adminPendingDrivers);
      if (driversRes.data['success'] == true) {
        _drivers = driversRes.data['pendingVerifications'] as List? ?? [];
      }
    } catch (_) {}

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  void _showDriverReviewSheet(Map<String, dynamic> driverData) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => _DriverReviewModal(
        driverData: driverData,
        onRefreshNeeded: () {
          _loadAdminData();
          ref.read(driverVerificationProvider.notifier).fetchVerificationStatus();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredDrivers = _drivers.filterByStatus(_selectedFilter);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Row(
          children: const [
            RideNowLogo(height: 26),
            SizedBox(width: 8),
            Text(
              'Compliance Admin',
              style: TextStyle(
                color: Colors.black,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Colors.black, size: 20),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.black),
            onPressed: _loadAdminData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadAdminData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // KPI Stats Cards Grid
                    _buildStatsRow1(),
                    const SizedBox(height: 12),
                    _buildStatsRow2(),
                    const SizedBox(height: 20),

                    // Filter Tabs
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildFilterChip('PENDING', 'Pending Review'),
                          const SizedBox(width: 8),
                          _buildFilterChip('APPROVED', 'Approved'),
                          const SizedBox(width: 8),
                          _buildFilterChip('REJECTED', 'Rejected'),
                          const SizedBox(width: 8),
                          _buildFilterChip('ALL', 'All Drivers'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Driver Cards List
                    if (filteredDrivers.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(32),
                        alignment: Alignment.center,
                        child: Column(
                          children: const [
                            Icon(Icons.done_all_rounded,
                                size: 48, color: Color(0xFF10B981)),
                            SizedBox(height: 12),
                            Text(
                              'No drivers matching filter.',
                              style: TextStyle(
                                  color: Color(0xFF64748B), fontSize: 14),
                            ),
                          ],
                        ),
                      )
                    else
                      ...filteredDrivers.map(
                        (d) => _buildDriverCard(d as Map<String, dynamic>),
                      ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatsRow1() {
    return Row(
      children: [
        Expanded(
          child: _buildMetricCard(
            title: 'Total Registered',
            value: '${_stats['totalDrivers'] ?? 0}',
            icon: Icons.groups_rounded,
            color: const Color(0xFF3B82F6),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildMetricCard(
            title: 'Pending Review',
            value: '${_stats['pendingVerification'] ?? 0}',
            icon: Icons.pending_actions_rounded,
            color: const Color(0xFFF59E0B),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildMetricCard(
            title: 'Approved',
            value: '${_stats['approvedDrivers'] ?? 0}',
            icon: Icons.verified_user_rounded,
            color: const Color(0xFF10B981),
          ),
        ),
      ],
    );
  }

  Widget _buildStatsRow2() {
    return Row(
      children: [
        Expanded(
          child: _buildMetricCard(
            title: 'Bike Drivers',
            value: '${_stats['bikeDrivers'] ?? 0}',
            icon: Icons.two_wheeler_rounded,
            color: const Color(0xFF6366F1),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildMetricCard(
            title: 'Car Drivers',
            value: '${_stats['carDrivers'] ?? 0}',
            icon: Icons.directions_car_rounded,
            color: const Color(0xFF06B6D4),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildMetricCard(
            title: 'Suspended',
            value: '${_stats['suspendedDrivers'] ?? 0}',
            icon: Icons.block_rounded,
            color: const Color(0xFFEF4444),
          ),
        ),
      ],
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String filterKey, String label) {
    final isSelected = _selectedFilter == filterKey;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppTheme.primaryYellow,
      labelStyle: TextStyle(
        color: isSelected ? Colors.black : const Color(0xFF64748B),
        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        fontSize: 12,
      ),
      onSelected: (_) => setState(() => _selectedFilter = filterKey),
    );
  }

  Widget _buildDriverCard(Map<String, dynamic> d) {
    final v = d['vehicle'] as Map<String, dynamic>? ?? {};
    final status = d['verificationStatus'] ?? 'PENDING';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: const Color(0xFFE2E8F0),
                backgroundImage: d['profilePhotoUrl'] != null
                    ? NetworkImage(d['profilePhotoUrl'])
                    : null,
                child: d['profilePhotoUrl'] == null
                    ? const Icon(Icons.person, color: Colors.grey)
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      d['fullName'] ?? 'Driver Partner',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${d['phone'] ?? ''} • ${v['category'] ?? 'BIKE'} (${v['registrationNumber'] ?? 'Plate Pending'})',
                      style: const TextStyle(
                          color: Color(0xFF64748B), fontSize: 12),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: status == 'APPROVED'
                      ? const Color(0xFFDCFCE7)
                      : const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: status == 'APPROVED'
                        ? const Color(0xFF16A34A)
                        : const Color(0xFF92400E),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Docs Uploaded: ${d['documentsCount'] ?? 0}',
                style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
              ),
              ElevatedButton.icon(
                onPressed: () => _showDriverReviewSheet(d),
                icon: const Icon(Icons.rate_review_outlined, size: 16),
                label: const Text('Review Documents'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                  visualDensity: VisualDensity.compact,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

extension DriverFilterExtension on List<dynamic> {
  List<dynamic> filterByStatus(String filter) {
    if (filter == 'ALL') return this;
    if (filter == 'PENDING') {
      return where((d) {
        final st = (d as Map<String, dynamic>)['verificationStatus'] ?? '';
        return ['PENDING', 'UNDER_REVIEW', 'DOCUMENTS_PENDING', 'CORRECTION_REQUIRED']
            .contains(st);
      }).toList();
    }
    return where((d) => (d as Map<String, dynamic>)['verificationStatus'] == filter)
        .toList();
  }
}

class _DriverReviewModal extends ConsumerStatefulWidget {
  final Map<String, dynamic> driverData;
  final VoidCallback onRefreshNeeded;

  const _DriverReviewModal({
    required this.driverData,
    required this.onRefreshNeeded,
  });

  @override
  ConsumerState<_DriverReviewModal> createState() => _DriverReviewModalState();
}

class _DriverReviewModalState extends ConsumerState<_DriverReviewModal> {
  bool _isProcessing = false;

  Future<void> _approveDriver() async {
    setState(() => _isProcessing = true);
    final driverId = widget.driverData['driverId'];
    final ok = await ref
        .read(driverVerificationProvider.notifier)
        .adminApproveDriver(driverId);

    if (mounted) {
      setState(() => _isProcessing = false);
      if (ok) {
        widget.onRefreshNeeded();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Driver approved! Driver can now go online.'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
      }
    }
  }

  Future<void> _rejectDriverWithReason() async {
    final reasonCtrl = TextEditingController(text: 'Documents blurred / expired');
    final reason = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reject Driver Verification'),
        content: TextField(
          controller: reasonCtrl,
          decoration: const InputDecoration(
            labelText: 'Enter Rejection Reason',
            hintText: 'e.g. Expired DL, invalid RC copy',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, reasonCtrl.text.trim()),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Confirm Reject'),
          ),
        ],
      ),
    );

    if (reason != null && reason.isNotEmpty) {
      setState(() => _isProcessing = true);
      final driverId = widget.driverData['driverId'];
      await ref
          .read(driverVerificationProvider.notifier)
          .adminRejectDriver(driverId, reason);

      if (mounted) {
        setState(() => _isProcessing = false);
        widget.onRefreshNeeded();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Driver rejected: $reason')),
        );
      }
    }
  }

  Future<void> _suspendDriver() async {
    setState(() => _isProcessing = true);
    final driverId = widget.driverData['driverId'];
    await ref
        .read(driverVerificationProvider.notifier)
        .adminSuspendDriver(driverId, 'Policy violation or complaint');

    if (mounted) {
      setState(() => _isProcessing = false);
      widget.onRefreshNeeded();
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Driver suspended.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.driverData;
    final docs = d['documents'] as List? ?? [];
    final v = d['vehicle'] as Map<String, dynamic>? ?? {};

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (_, scrollCtrl) => SingleChildScrollView(
        controller: scrollCtrl,
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            Text(
              'Review Driver: ${d['fullName']}',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            Text(
              'Phone: ${d['phone']} • Vehicle: ${v['make'] ?? ''} ${v['model'] ?? ''} (${v['registrationNumber'] ?? ''})',
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
            ),
            const SizedBox(height: 20),

            // Documents List
            const Text(
              'Uploaded Verification Documents:',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            const SizedBox(height: 10),

            if (docs.isEmpty)
              const Text('No documents uploaded yet.',
                  style: TextStyle(color: Colors.grey))
            else
              ...docs.map((doc) => _buildDocReviewRow(doc as Map<String, dynamic>)),

            const SizedBox(height: 24),

            // Admin Final Decision Buttons
            ElevatedButton.icon(
              onPressed: _isProcessing ? null : _approveDriver,
              icon: const Icon(Icons.check_circle_rounded, color: Colors.white),
              label: const Text(
                'Approve Driver Profile (Grant Online Access)',
                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
            const SizedBox(height: 10),

            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _isProcessing ? null : _rejectDriverWithReason,
                    icon: const Icon(Icons.cancel_outlined, color: Colors.red),
                    label: const Text(
                      'Reject Driver',
                      style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.red),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _isProcessing ? null : _suspendDriver,
                    icon: const Icon(Icons.block_rounded, color: Colors.orange),
                    label: const Text(
                      'Suspend Account',
                      style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.orange),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDocReviewRow(Map<String, dynamic> doc) {
    final docType = doc['documentType'] ?? '';
    final status = doc['status'] ?? 'PENDING';
    final docId = doc['id'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                docType,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
              Text(
                status,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: status == 'APPROVED' ? Colors.green : Colors.orange,
                ),
              ),
            ],
          ),
          if (doc['expiryDate'] != null)
            Text(
              'Expiry: ${doc['expiryDate']}',
              style: const TextStyle(fontSize: 11, color: Colors.grey),
            ),
          const SizedBox(height: 8),

          Row(
            children: [
              TextButton.icon(
                onPressed: () async {
                  if (docId.isNotEmpty) {
                    await ref
                        .read(driverVerificationProvider.notifier)
                        .adminApproveDoc(docId);
                    widget.onRefreshNeeded();
                    setState(() {});
                  }
                },
                icon: const Icon(Icons.check, size: 14, color: Colors.green),
                label: const Text('Approve Doc',
                    style: TextStyle(color: Colors.green, fontSize: 11)),
              ),
              TextButton.icon(
                onPressed: () async {
                  if (docId.isNotEmpty) {
                    await ref
                        .read(driverVerificationProvider.notifier)
                        .adminRejectDoc(docId, 'Illegible or incorrect copy');
                    widget.onRefreshNeeded();
                    setState(() {});
                  }
                },
                icon: const Icon(Icons.close, size: 14, color: Colors.red),
                label: const Text('Reject Doc',
                    style: TextStyle(color: Colors.red, fontSize: 11)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

