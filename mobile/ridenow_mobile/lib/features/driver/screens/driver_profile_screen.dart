import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../app/config/environment.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/widgets/ridenow_logo.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/driver_dashboard_provider.dart';

class DriverProfileScreen extends ConsumerStatefulWidget {
  const DriverProfileScreen({super.key});

  @override
  ConsumerState<DriverProfileScreen> createState() => _DriverProfileScreenState();
}

class _DriverProfileScreenState extends ConsumerState<DriverProfileScreen> {
  bool _soundAlerts = true;
  bool _autoAccept = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(driverDashboardProvider.notifier).fetchProfile();
    });
  }

  Future<void> _makeCall(String phoneNumber) async {
    final uri = Uri.parse('tel:$phoneNumber');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _showEditProfileDialog(Map<String, dynamic>? profile) {
    final nameCtrl = TextEditingController(text: profile?['fullName'] ?? '');
    final emailCtrl = TextEditingController(text: profile?['email'] ?? '');
    final phoneCtrl = TextEditingController(text: profile?['phone'] ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceDark,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppTheme.primaryYellow),
        ),
        title: const Text(
          'Edit Profile Details',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: 'Full Name'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: phoneCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: 'Phone Number'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: emailCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: 'Email Address'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final ok = await ref
                  .read(driverDashboardProvider.notifier)
                  .updateDriverProfile({
                'fullName': nameCtrl.text.trim(),
                'phone': phoneCtrl.text.trim(),
                'email': emailCtrl.text.trim(),
              });
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(ok
                        ? 'Profile updated successfully!'
                        : 'Failed to update profile.'),
                    backgroundColor: ok ? Colors.green : Colors.red,
                  ),
                );
              }
            },
            child: const Text('Save Changes'),
          ),
        ],
      ),
    );
  }

  void _showEditVehicleDialog(Map<String, dynamic>? vehicle) {
    final makeCtrl = TextEditingController(text: vehicle?['make'] ?? 'Bajaj');
    final modelCtrl = TextEditingController(text: vehicle?['model'] ?? 'RE Compact');
    final regCtrl = TextEditingController(
        text: vehicle?['registrationNumber'] ?? 'MP 09 AB 1234');
    final colorCtrl = TextEditingController(text: vehicle?['color'] ?? 'Green & Yellow');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceDark,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppTheme.primaryYellow),
        ),
        title: const Text(
          'Edit Vehicle Information',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: makeCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: 'Vehicle Brand / Make'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: modelCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: 'Model & Variant'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: regCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: 'RC Registration Number'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: colorCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: 'Vehicle Color'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final ok = await ref
                  .read(driverDashboardProvider.notifier)
                  .updateDriverProfile({
                'make': makeCtrl.text.trim(),
                'model': modelCtrl.text.trim(),
                'registrationNumber': regCtrl.text.trim(),
                'color': colorCtrl.text.trim(),
              });
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(ok
                        ? 'Vehicle details updated!'
                        : 'Failed to update vehicle.'),
                    backgroundColor: ok ? Colors.green : Colors.red,
                  ),
                );
              }
            },
            child: const Text('Update Vehicle'),
          ),
        ],
      ),
    );
  }

  void _showPayoutSheet(double balance) {
    final upiCtrl = TextEditingController(text: 'driver@okhdfcbank');

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      backgroundColor: AppTheme.surfaceDark,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[600],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Driver Wallet & Instant Payout',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryYellow, AppTheme.secondaryAmber],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Available Balance',
                        style: TextStyle(
                          color: Colors.black87,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '₹${balance.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          color: Colors.black,
                        ),
                      ),
                    ],
                  ),
                  const Icon(Icons.account_balance_wallet,
                      color: Colors.black87, size: 36),
                ],
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: upiCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'Payout UPI ID (Google Pay / PhonePe)',
                prefixIcon: Icon(Icons.qr_code, color: AppTheme.primaryYellow),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Payout request of full balance initiated to UPI ID.'),
                    backgroundColor: Colors.green,
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
              ),
              child: const Text('Transfer to Bank Account / UPI'),
            ),
          ],
        ),
      ),
    );
  }

  void _showSafetyHelpline() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      backgroundColor: AppTheme.surfaceDark,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[600],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: const [
                Icon(Icons.shield_rounded, color: AppTheme.primaryYellow, size: 28),
                SizedBox(width: 10),
                Text(
                  'Driver Partner Safety & SOS',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                _makeCall(EnvironmentConfig.emergencySosNumber);
              },
              icon: const Icon(Icons.emergency, color: Colors.white),
              label: Text(
                'Police & Ambulance (${EnvironmentConfig.emergencySosNumber})',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red[600],
                minimumSize: const Size.fromHeight(50),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                _makeCall('18002004000');
              },
              icon: const Icon(Icons.support_agent_rounded, color: Colors.white),
              label: const Text(
                '24x7 RideNow Partner Support (+91 1800 200 4000)',
                style: TextStyle(color: Colors.white),
              ),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
                side: const BorderSide(color: AppTheme.borderLight),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmSignOut() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Driver Sign Out',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text(
          'Are you sure you want to go offline and sign out of your driver partner account?',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(authProvider.notifier).logout();
              if (mounted) context.go('/');
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.errorRed),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final driverState = ref.watch(driverDashboardProvider);
    final profile = driverState.driverProfile;
    final vehicle = profile?['vehicle'] as Map<String, dynamic>?;

    final displayName = profile?['fullName'] ?? authState.user?.fullName ?? 'Manoj Kumar';
    final displayPhone = profile?['phone'] ?? authState.user?.phone ?? '+919876543210';
    final isApproved = driverState.isApproved;
    final walletBalance = (profile?['walletBalance'] as num?)?.toDouble() ?? 1250.0;
    final rating = (profile?['rating'] as num?)?.toDouble() ?? 4.85;

    return Scaffold(
      backgroundColor: AppTheme.backgroundBlack,
      appBar: AppBar(
        backgroundColor: AppTheme.surfaceDark,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.primaryYellow, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            RideNowLogo(height: 24, isDark: true),
            SizedBox(width: 8),
            Text(
              'Pilot Profile',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
        child: Column(
          children: [
            // ----------------------------------------------------
            // 1. Top Driver Profile Card
            // ----------------------------------------------------
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppTheme.surfaceDark,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.borderSubtle),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.4),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      // Avatar
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppTheme.primaryYellow, AppTheme.secondaryAmber],
                          ),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primaryYellow.withOpacity(0.3),
                              blurRadius: 10,
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            displayName.isNotEmpty ? displayName[0].toUpperCase() : 'D',
                            style: const TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                              color: Colors.black,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      // Name & Phone
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              displayName,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              displayPhone,
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppTheme.textMuted,
                              ),
                            ),
                            const SizedBox(height: 6),
                            // Rating Badge
                            Row(
                              children: [
                                const Icon(Icons.star_rounded,
                                    color: AppTheme.primaryYellow, size: 16),
                                const SizedBox(width: 4),
                                Text(
                                  '$rating ★ (142 Trips)',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      // Edit Profile Button
                      IconButton(
                        icon: const Icon(Icons.edit_outlined, color: AppTheme.primaryYellow),
                        onPressed: () => _showEditProfileDialog(profile),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Divider(color: AppTheme.borderLight, height: 1),
                  const SizedBox(height: 12),
                  // Verification Badge
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            isApproved
                                ? Icons.verified_rounded
                                : Icons.pending_actions_rounded,
                            color: isApproved
                                ? AppTheme.successGreen
                                : Colors.amber,
                            size: 20,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            isApproved ? 'KYC Verified Partner' : 'Verification Pending',
                            style: TextStyle(
                              color: isApproved
                                  ? AppTheme.successGreen
                                  : Colors.amber,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                      TextButton(
                        onPressed: () => context.push('/driver/kyc'),
                        child: const Text('View KYC Docs →',
                            style: TextStyle(color: AppTheme.primaryYellow, fontSize: 12)),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // ----------------------------------------------------
            // 2. Assigned Vehicle Details Card
            // ----------------------------------------------------
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.surfaceDark,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.electric_rickshaw_rounded,
                              color: AppTheme.primaryYellow, size: 22),
                          SizedBox(width: 8),
                          Text(
                            'Vehicle Details',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit_note_rounded,
                            color: AppTheme.primaryYellow),
                        onPressed: () => _showEditVehicleDialog(vehicle),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  _buildVehicleRow('Vehicle Model',
                      '${vehicle?['make'] ?? 'Bajaj'} ${vehicle?['model'] ?? 'RE Compact (CNG)'}'),
                  _buildVehicleRow('Registration No.',
                      vehicle?['registrationNumber'] ?? 'MP 09 AB 1234'),
                  _buildVehicleRow('Category', vehicle?['category'] ?? 'AUTO (3-Wheeler)'),
                  _buildVehicleRow('Color', vehicle?['color'] ?? 'Green & Yellow'),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // ----------------------------------------------------
            // 3. Earnings & Wallet Quick Card
            // ----------------------------------------------------
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.borderSubtle),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Driver Earnings Wallet',
                        style: TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '₹${walletBalance.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.primaryYellow,
                        ),
                      ),
                    ],
                  ),
                  ElevatedButton(
                    onPressed: () => _showPayoutSheet(walletBalance),
                    child: const Text('Instant Payout'),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // ----------------------------------------------------
            // 4. Partner Operations & Settings Menu
            // ----------------------------------------------------
            Container(
              decoration: BoxDecoration(
                color: AppTheme.surfaceDark,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Column(
                  children: [
                    // KYC Documents
                    _buildMenuTile(
                      icon: Icons.document_scanner_rounded,
                      title: 'Manage KYC Documents',
                      subtitle: 'Driving license, RC, Insurance, Aadhaar',
                      onTap: () => context.push('/driver/kyc'),
                    ),
                    _buildDivider(),

                    // Sound Alert Toggle
                    SwitchListTile(
                      secondary: const Icon(Icons.volume_up_rounded,
                          color: AppTheme.primaryYellow),
                      title: const Text('Dispatch Sound Alert',
                          style: TextStyle(color: Colors.white, fontSize: 14)),
                      subtitle: const Text('Play sound when ride request arrives',
                          style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                      value: _soundAlerts,
                      activeColor: AppTheme.primaryYellow,
                      onChanged: (val) => setState(() => _soundAlerts = val),
                    ),
                    _buildDivider(),

                    // Auto-Accept Toggle
                    SwitchListTile(
                      secondary: const Icon(Icons.auto_awesome_rounded,
                          color: AppTheme.primaryYellow),
                      title: const Text('Auto-Accept Nearby Rides',
                          style: TextStyle(color: Colors.white, fontSize: 14)),
                      subtitle: const Text('Automatically accept requests within 2 km',
                          style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                      value: _autoAccept,
                      activeColor: AppTheme.primaryYellow,
                      onChanged: (val) => setState(() => _autoAccept = val),
                    ),
                    _buildDivider(),

                    // Safety & Helpline
                    _buildMenuTile(
                      icon: Icons.shield_outlined,
                      title: 'Safety Helpline & SOS',
                      subtitle: '24x7 support hotline and emergency police',
                      onTap: _showSafetyHelpline,
                    ),
                    _buildDivider(),

                    // Terms & App Info
                    _buildMenuTile(
                      icon: Icons.info_outline_rounded,
                      title: 'About RideNow Driver Fleet',
                      subtitle: 'App v2.4.0 • Commission 15% • Partner Terms',
                      onTap: () {
                        showDialog(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            backgroundColor: AppTheme.surfaceDark,
                            title: const Text('About Partner App',
                                style: TextStyle(color: Colors.white)),
                            content: const Text(
                              'RideNow Mobility Fleet Partner v2.4.0\n\n'
                              '• Dedicated driver earnings rate: 85%\n'
                              '• 24x7 roadside & accident insurance protection\n'
                              '• Fast daily payout settlements',
                              style: TextStyle(color: Colors.white70),
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(ctx),
                                child: const Text('OK'),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // ----------------------------------------------------
            // 5. Sign Out Button
            // ----------------------------------------------------
            Container(
              decoration: BoxDecoration(
                color: AppTheme.surfaceDark,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.errorRed.withOpacity(0.3)),
              ),
              child: ListTile(
                onTap: _confirmSignOut,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                leading: const Icon(Icons.logout_rounded, color: AppTheme.errorRed),
                title: const Text(
                  'Sign Out from Driver Partner',
                  style: TextStyle(
                    color: AppTheme.errorRed,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                trailing: const Icon(Icons.chevron_right_rounded,
                    color: AppTheme.textMuted),
              ),
            ),

            const SizedBox(height: 24),
            Center(
              child: Column(
                children: const [
                  RideNowLogo(height: 28, isDark: true),
                  SizedBox(height: 6),
                  Text(
                    'RideNow Partner Fleet v2.4.0 • Indian Urban Mobility',
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVehicleRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppTheme.textMuted, fontSize: 13)),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primaryYellow),
      title: Text(title, style: const TextStyle(color: Colors.white, fontSize: 14)),
      subtitle: Text(subtitle,
          style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
      trailing: const Icon(Icons.chevron_right_rounded,
          color: AppTheme.textMuted, size: 20),
      onTap: onTap,
    );
  }

  Widget _buildDivider() {
    return const Divider(height: 1, thickness: 0.5, color: AppTheme.borderLight);
  }
}

