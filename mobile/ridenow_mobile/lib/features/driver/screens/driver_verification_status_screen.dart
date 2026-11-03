import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/widgets/ridenow_logo.dart';
import '../providers/driver_verification_provider.dart';

class DriverVerificationStatusScreen extends ConsumerStatefulWidget {
  const DriverVerificationStatusScreen({super.key});

  @override
  ConsumerState<DriverVerificationStatusScreen> createState() =>
      _DriverVerificationStatusScreenState();
}

class _DriverVerificationStatusScreenState
    extends ConsumerState<DriverVerificationStatusScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(driverVerificationProvider.notifier).fetchVerificationStatus();
    });
  }

  void _reuploadDocument(VerificationDocItem doc) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Re-upload ${doc.displayName}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              doc.rejectionReason != null
                  ? 'Rejection reason: "${doc.rejectionReason}". Please upload a clearer copy.'
                  : 'Upload an updated document to complete compliance review.',
              style: const TextStyle(color: Colors.redAccent, fontSize: 13),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () async {
                Navigator.pop(ctx);
                final notifier =
                    ref.read(driverVerificationProvider.notifier);
                await notifier.uploadDocument(
                  documentType: doc.documentType,
                  fileUrl:
                      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
                  fileName: '${doc.documentType}_corrected.jpg',
                  fileSize: 1024 * 800,
                  expiryDate: doc.expiryDate ?? '2028-12-31',
                );
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                        '${doc.displayName} re-uploaded. Submitted for verification.'),
                  ),
                );
              },
              icon: const Icon(Icons.cloud_upload_rounded),
              label: const Text('Select & Upload Corrected Document'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryYellow,
                foregroundColor: Colors.black,
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(driverVerificationProvider);

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
              'Verification Status',
              style: TextStyle(
                color: Colors.black,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.black),
            onPressed: () {
              ref
                  .read(driverVerificationProvider.notifier)
                  .fetchVerificationStatus();
            },
          ),
          // Shortcut to Admin Dashboard for reviewer demo
          IconButton(
            icon: const Icon(Icons.admin_panel_settings_outlined,
                color: Colors.black),
            tooltip: 'Admin Review Dashboard',
            onPressed: () => context.push('/admin/verifications'),
          ),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => ref
                  .read(driverVerificationProvider.notifier)
                  .fetchVerificationStatus(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Top Hero Status Card
                    _buildStatusHeroCard(state),
                    const SizedBox(height: 20),

                    // Vehicle & Driver Details Card
                    if (state.vehicle != null) _buildVehicleCard(state),
                    const SizedBox(height: 20),

                    // Documents Breakdown
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Compliance Documents',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '${state.approvedCount}/${state.totalRequired} Approved',
                          style: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF64748B),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Document List
                    ...state.documents
                        .map((doc) => _buildDocumentItemCard(doc)),

                    const SizedBox(height: 20),

                    // Action Button depending on status
                    if (state.isApproved)
                      ElevatedButton.icon(
                        onPressed: () => context.go('/driver/dashboard'),
                        icon: const Icon(Icons.speed_rounded, color: Colors.black),
                        label: const Text(
                          'Go to Driver Dashboard (Start Driving)',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: Colors.black,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryYellow,
                          minimumSize: const Size.fromHeight(54),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      )
                    else if (state.needsCorrection)
                      ElevatedButton.icon(
                        onPressed: () {
                          final rejected = state.documents
                              .firstWhere((d) => d.status == 'REJECTED',
                                  orElse: () => state.documents.first);
                          _reuploadDocument(rejected);
                        },
                        icon: const Icon(Icons.file_upload_outlined,
                            color: Colors.white),
                        label: const Text(
                          'Re-upload Rejected Documents',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: Colors.white,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFEF4444),
                          minimumSize: const Size.fromHeight(54),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      )
                    else if (state.isPendingDocuments)
                      ElevatedButton.icon(
                        onPressed: () => context.push('/driver/register'),
                        icon: const Icon(Icons.add_circle_outline,
                            color: Colors.black),
                        label: const Text(
                          'Complete Document Upload',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: Colors.black,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryYellow,
                          minimumSize: const Size.fromHeight(54),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatusHeroCard(DriverVerificationState state) {
    Color bg;
    Color border;
    IconData icon;
    String title;
    String subtitle;

    switch (state.verificationStatus) {
      case 'APPROVED':
        bg = const Color(0xFFECFDF5);
        border = const Color(0xFFA7F3D0);
        icon = Icons.verified_rounded;
        title = 'Driver Account Verified & Approved';
        subtitle =
            'You are fully compliant with MVA 2019 guidelines. You can now toggle online and accept rides!';
        break;
      case 'UNDER_REVIEW':
        bg = const Color(0xFFFEF3C7);
        border = const Color(0xFFFDE68A);
        icon = Icons.hourglass_top_rounded;
        title = 'Verification Under Review';
        subtitle =
            'Your documents are being checked by the RideNow compliance team. Review SLA is 2 to 4 hours.';
        break;
      case 'CORRECTION_REQUIRED':
        bg = const Color(0xFFFEF2F2);
        border = const Color(0xFFFECACA);
        icon = Icons.error_outline_rounded;
        title = 'Action Required: Document Correction';
        subtitle =
            'One or more documents require correction or re-upload. Check the items below.';
        break;
      case 'REJECTED':
        bg = const Color(0xFFFEF2F2);
        border = const Color(0xFFFCA5A5);
        icon = Icons.cancel_outlined;
        title = 'Verification Rejected';
        subtitle =
            'Your application did not satisfy compliance guidelines. Tap support to appeal.';
        break;
      case 'SUSPENDED':
        bg = const Color(0xFFF1F5F9);
        border = const Color(0xFFCBD5E1);
        icon = Icons.block_rounded;
        title = 'Account Suspended';
        subtitle =
            'Real-time dispatch is suspended. Please contact RideNow partner safety desk.';
        break;
      default:
        bg = const Color(0xFFEFF6FF);
        border = const Color(0xFFBFDBFE);
        icon = Icons.assignment_outlined;
        title = 'Documents Pending';
        subtitle =
            'Upload all 7 mandatory documents to submit your application for review.';
        break;
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 28, color: Colors.black87),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            subtitle,
            style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
          ),
          const SizedBox(height: 16),

          // Progress bar
          LinearProgressIndicator(
            value: state.completionPercentage / 100,
            backgroundColor: Colors.white,
            valueColor: AlwaysStoppedAnimation<Color>(
              state.isApproved ? const Color(0xFF10B981) : AppTheme.primaryYellow,
            ),
            minHeight: 8,
            borderRadius: BorderRadius.circular(4),
          ),
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              '${state.completionPercentage}% Complete',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Color(0xFF475569),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVehicleCard(DriverVerificationState state) {
    final v = state.vehicle!;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              v['category'] == 'BIKE'
                  ? Icons.two_wheeler_rounded
                  : Icons.directions_car_rounded,
              size: 28,
              color: Colors.black87,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${v['make'] ?? ''} ${v['model'] ?? ''}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'Plate: ${v['registrationNumber']} • Color: ${v['color']}',
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              v['category'] ?? 'BIKE',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Color(0xFF92400E),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentItemCard(VerificationDocItem doc) {
    Color badgeBg;
    Color badgeText;
    String badgeLabel;

    switch (doc.status) {
      case 'APPROVED':
        badgeBg = const Color(0xFFDCFCE7);
        badgeText = const Color(0xFF16A34A);
        badgeLabel = 'APPROVED';
        break;
      case 'REJECTED':
        badgeBg = const Color(0xFFFEE2E2);
        badgeText = const Color(0xFFDC2626);
        badgeLabel = 'REJECTED';
        break;
      case 'EXPIRED':
        badgeBg = const Color(0xFFFEF3C7);
        badgeText = const Color(0xFFD97706);
        badgeLabel = 'EXPIRED';
        break;
      case 'PENDING':
        badgeBg = const Color(0xFFEFF6FF);
        badgeText = const Color(0xFF2563EB);
        badgeLabel = 'UNDER REVIEW';
        break;
      default:
        badgeBg = const Color(0xFFF1F5F9);
        badgeText = const Color(0xFF64748B);
        badgeLabel = 'NOT UPLOADED';
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: doc.status == 'REJECTED'
              ? const Color(0xFFFCA5A5)
              : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  doc.displayName,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  badgeLabel,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: badgeText,
                  ),
                ),
              ),
            ],
          ),
          if (doc.documentNumber != null) ...[
            const SizedBox(height: 4),
            Text(
              'Doc No: ${doc.documentNumber}',
              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
            ),
          ],
          if (doc.expiryDate != null) ...[
            const SizedBox(height: 2),
            Text(
              'Expiry: ${doc.expiryDate}',
              style: TextStyle(
                fontSize: 12,
                color: doc.isExpired ? Colors.red : const Color(0xFF64748B),
                fontWeight:
                    doc.isExpired ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
          if (doc.rejectionReason != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info, color: Colors.red, size: 16),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Reason: ${doc.rejectionReason}',
                      style:
                          const TextStyle(color: Colors.red, fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => _reuploadDocument(doc),
              icon: const Icon(Icons.cloud_upload_outlined, size: 16),
              label: const Text('Re-upload Now'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(36),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

