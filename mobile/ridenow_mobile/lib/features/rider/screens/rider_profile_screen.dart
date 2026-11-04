import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../app/config/environment.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/widgets/ridenow_logo.dart';
import '../../auth/providers/auth_provider.dart';

class RiderProfileScreen extends ConsumerStatefulWidget {
  const RiderProfileScreen({super.key});

  @override
  ConsumerState<RiderProfileScreen> createState() => _RiderProfileScreenState();
}

class _RiderProfileScreenState extends ConsumerState<RiderProfileScreen> {
  // Notification states
  bool _pushNotifications = true;
  bool _rideBookingAlerts = true;
  bool _driverArrivalAlerts = true;
  bool _rideStatusAlerts = true;
  bool _paymentAlerts = true;
  bool _promotionalAlerts = false;
  bool _smsUpdates = false;

  // Selected language
  String _selectedLanguage = 'English';

  @override
  void initState() {
    super.initState();
    _loadStoredPreferences();
  }

  void _loadStoredPreferences() {
    final storage = ref.read(storageServiceProvider);
    final prefs = storage.getNotificationPreferences();
    if (prefs != null) {
      setState(() {
        _pushNotifications = prefs['pushNotifications'] ?? true;
        _rideBookingAlerts = prefs['rideBookingAlerts'] ?? true;
        _driverArrivalAlerts = prefs['driverArrivalAlerts'] ?? true;
        _rideStatusAlerts = prefs['rideStatusAlerts'] ?? true;
        _paymentAlerts = prefs['paymentAlerts'] ?? true;
        _promotionalAlerts = prefs['promotionalAlerts'] ?? false;
        _smsUpdates = prefs['smsUpdates'] ?? false;
      });
    }
  }

  Future<void> _makeCall(String phoneNumber) async {
    final uri = Uri.parse('tel:$phoneNumber');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not launch phone dialer for $phoneNumber')),
        );
      }
    }
  }

  Future<void> _sendEmail(String email, {String subject = '', String body = ''}) async {
    final uri = Uri(
      scheme: 'mailto',
      path: email,
      queryParameters: {
        if (subject.isNotEmpty) 'subject': subject,
        if (body.isNotEmpty) 'body': body,
      },
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (mounted) {
        Clipboard.setData(ClipboardData(text: email));
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Support email copied: $email')),
        );
      }
    }
  }

  // =========================================================================
  // 1. EDIT PROFILE (Name, Email, Mobile, Profile Photo, Persistence)
  // =========================================================================
  void _showEditProfileSheet(BuildContext context) {
    final authState = ref.read(authProvider);
    final user = authState.user;
    final customerProfile = user?.customerProfile ?? {};

    final nameController = TextEditingController(text: user?.fullName ?? '');
    final emailController = TextEditingController(text: user?.email ?? '');
    final phoneController = TextEditingController(text: user?.phone ?? '');
    final formKey = GlobalKey<FormState>();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 16,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 44,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Edit Profile',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, color: Colors.grey),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Avatar display with camera edit badge
                  Center(
                    child: Stack(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: const BoxDecoration(
                            color: Color(0xFFFACC15),
                            shape: BoxShape.circle,
                          ),
                          child: const Center(
                            child: Icon(Icons.person, size: 50, color: Colors.black87),
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(
                              color: Colors.black,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Full Name Field
                  const Text('Full Name', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.black87)),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: nameController,
                    decoration: InputDecoration(
                      hintText: 'Enter your full name',
                      prefixIcon: const Icon(Icons.person_outline, size: 20),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) return 'Full name is required';
                      return null;
                    },
                  ),
                  const SizedBox(height: 14),

                  // Mobile Number Field
                  const Text('Mobile Number', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.black87)),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      hintText: '10-digit mobile number',
                      prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                      prefixText: '+91 ',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) return 'Mobile number is required';
                      final digits = val.replaceAll(RegExp(r'\D'), '');
                      if (digits.length < 10) return 'Enter a valid 10-digit mobile number';
                      return null;
                    },
                  ),
                  const SizedBox(height: 14),

                  // Email Field
                  const Text('Email Address', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.black87)),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      hintText: 'Enter your email address',
                      prefixIcon: const Icon(Icons.email_outlined, size: 20),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                    validator: (val) {
                      if (val != null && val.isNotEmpty && !val.contains('@')) {
                        return 'Enter a valid email address';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),

                  // Save Profile Button
                  ElevatedButton(
                    onPressed: () async {
                      if (formKey.currentState?.validate() != true) return;
                      Navigator.pop(ctx);

                      final cleanPhone = phoneController.text.trim().replaceAll(RegExp(r'\D'), '');
                      final formattedPhone = cleanPhone.length == 10 ? '+91$cleanPhone' : phoneController.text.trim();

                      final success = await ref.read(authProvider.notifier).updateCustomerProfile(
                        fullName: nameController.text.trim(),
                        phone: formattedPhone,
                        email: emailController.text.trim(),
                      );

                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(success ? 'Profile updated and saved successfully!' : 'Failed to save profile.'),
                            backgroundColor: success ? const Color(0xFF10B981) : Colors.red,
                          ),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFACC15),
                      foregroundColor: Colors.black,
                      minimumSize: const Size.fromHeight(50),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Save Profile Changes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // =========================================================================
  // 2. HELP & SUPPORT (FAQs, Tickets, Raise Ticket, Ride Complaints, Contact)
  // =========================================================================
  void _showHelpCenterSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => DefaultTabController(
        length: 3,
        child: Container(
          height: MediaQuery.of(context).size.height * 0.85,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Help & Support Desk',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.grey),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const TabBar(
                labelColor: Colors.black,
                unselectedLabelColor: Colors.grey,
                indicatorColor: Color(0xFFF59E0B),
                indicatorWeight: 3,
                tabs: [
                  Tab(text: 'FAQs'),
                  Tab(text: 'Raise Ticket'),
                  Tab(text: 'My Tickets'),
                ],
              ),
              const SizedBox(height: 10),
              Expanded(
                child: TabBarView(
                  children: [
                    // Tab 1: FAQs & Instant Contact
                    _buildFaqTab(context),
                    // Tab 2: Raise Ticket Form
                    _buildRaiseTicketTab(context),
                    // Tab 3: My Support Tickets
                    _buildMyTicketsTab(context),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFaqTab(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.only(top: 8, bottom: 20),
      children: [
        // Contact options banner
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF9FAFB),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              InkWell(
                onTap: () => _makeCall('18002004000'),
                child: Column(
                  children: const [
                    CircleAvatar(
                      backgroundColor: Color(0xFFEFF6FF),
                      child: Icon(Icons.phone, color: Color(0xFF2563EB)),
                    ),
                    SizedBox(height: 6),
                    Text('Call 24x7', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    Text('1800-200-4000', style: TextStyle(fontSize: 10, color: Colors.grey)),
                  ],
                ),
              ),
              InkWell(
                onTap: () => _sendEmail('support@ridenow.in', subject: 'RideNow Support Request'),
                child: Column(
                  children: const [
                    CircleAvatar(
                      backgroundColor: Color(0xFFF0FDF4),
                      child: Icon(Icons.email_outlined, color: Color(0xFF16A34A)),
                    ),
                    SizedBox(height: 6),
                    Text('Email Us', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    Text('support@ridenow.in', style: TextStyle(fontSize: 10, color: Colors.grey)),
                  ],
                ),
              ),
              InkWell(
                onTap: () => _showSafetySheet(context),
                child: Column(
                  children: const [
                    CircleAvatar(
                      backgroundColor: Color(0xFFFEF2F2),
                      child: Icon(Icons.shield_outlined, color: Color(0xFFDC2626)),
                    ),
                    SizedBox(height: 6),
                    Text('Emergency', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    Text('Safety SOS', style: TextStyle(fontSize: 10, color: Colors.grey)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text('FREQUENTLY ASKED QUESTIONS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.8)),
        const SizedBox(height: 8),

        ExpansionTile(
          title: const Text('How do I book a ride on RideNow?', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          children: const [
            Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Text(
                'Enter your drop location on the home screen, select your preferred ride option (Bike, Auto, Auto Lite, or Cab), and click Book Ride. A nearby verified driver will be assigned instantly.',
                style: TextStyle(fontSize: 13, color: Colors.black87, height: 1.4),
              ),
            ),
          ],
        ),
        ExpansionTile(
          title: const Text('What payment methods are supported?', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          children: const [
            Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Text(
                'RideNow supports UPI (Google Pay, PhonePe, Paytm), Credit & Debit cards, RideNow in-app Wallet, and direct Cash on Delivery to the driver.',
                style: TextStyle(fontSize: 13, color: Colors.black87, height: 1.4),
              ),
            ),
          ],
        ),
        ExpansionTile(
          title: const Text('How is the ride fare calculated?', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          children: const [
            Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Text(
                'Fares are calculated based on transparent base fares + per-kilometer rates calculated via open routing engines. Zero surge pricing ensures transparent and fair fares at all times.',
                style: TextStyle(fontSize: 13, color: Colors.black87, height: 1.4),
              ),
            ),
          ],
        ),
        ExpansionTile(
          title: const Text('Can I cancel a ride after booking?', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          children: const [
            Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Text(
                'Yes. You can cancel a ride for free within 3 minutes of booking. If cancelled after the driver arrives at your pickup location, a standard cancellation fee of ₹20 may apply.',
                style: TextStyle(fontSize: 13, color: Colors.black87, height: 1.4),
              ),
            ),
          ],
        ),
        ExpansionTile(
          title: const Text('How do I get a refund for a failed transaction?', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          children: const [
            Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Text(
                'For online UPI or card debits where a ride was cancelled or failed, refunds are initiated automatically back to the original source within 24-48 business hours. You can also raise a support ticket under "Billing" to expedite.',
                style: TextStyle(fontSize: 13, color: Colors.black87, height: 1.4),
              ),
            ),
          ],
        ),
        ExpansionTile(
          title: const Text('Is my personal contact number shared with the driver?', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          children: const [
            Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Text(
                'RideNow provides secure in-app messaging and call masking to protect rider privacy. Drivers only receive masked routing identifiers.',
                style: TextStyle(fontSize: 13, color: Colors.black87, height: 1.4),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRaiseTicketTab(BuildContext context) {
    final formKey = GlobalKey<FormState>();
    final subjectController = TextEditingController();
    final descriptionController = TextEditingController();
    final rideIdController = TextEditingController();
    String selectedCategory = 'Ride Issue';
    String selectedPriority = 'NORMAL';

    return StatefulBuilder(
      builder: (ctx, setTicketState) => Form(
        key: formKey,
        child: ListView(
          padding: const EdgeInsets.only(top: 8, bottom: 20),
          children: [
            const Text('Issue Category', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              value: selectedCategory,
              decoration: InputDecoration(
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
              items: const [
                DropdownMenuItem(value: 'Ride Issue', child: Text('Ride Issue / Route Complaint')),
                DropdownMenuItem(value: 'Billing & Charges', child: Text('Billing / Overcharge / Refund')),
                DropdownMenuItem(value: 'Driver Conduct', child: Text('Driver Misbehavior / Rude Conduct')),
                DropdownMenuItem(value: 'Vehicle Condition', child: Text('Vehicle Cleanliness / AC')),
                DropdownMenuItem(value: 'Safety Concern', child: Text('Safety / Security Concern')),
                DropdownMenuItem(value: 'App Bug / Technical', child: Text('App Bug / Technical Problem')),
                DropdownMenuItem(value: 'Other', child: Text('Other Query')),
              ],
              onChanged: (val) {
                if (val != null) setTicketState(() => selectedCategory = val);
              },
            ),
            const SizedBox(height: 14),

            const Text('Ride ID (Optional)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 6),
            TextFormField(
              controller: rideIdController,
              decoration: InputDecoration(
                hintText: 'e.g. RIDE-10492',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
            const SizedBox(height: 14),

            const Text('Subject', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 6),
            TextFormField(
              controller: subjectController,
              decoration: InputDecoration(
                hintText: 'Brief summary of the issue',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
              validator: (val) {
                if (val == null || val.trim().isEmpty) return 'Please enter a subject';
                return null;
              },
            ),
            const SizedBox(height: 14),

            const Text('Detailed Description', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 6),
            TextFormField(
              controller: descriptionController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Describe what happened in detail...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
              validator: (val) {
                if (val == null || val.trim().length < 5) return 'Please provide more details (min 5 characters)';
                return null;
              },
            ),
            const SizedBox(height: 14),

            Row(
              children: [
                const Text('Priority:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(width: 12),
                ChoiceChip(
                  label: const Text('Normal'),
                  selected: selectedPriority == 'NORMAL',
                  onSelected: (val) => setTicketState(() => selectedPriority = 'NORMAL'),
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: const Text('Urgent'),
                  selected: selectedPriority == 'URGENT',
                  selectedColor: Colors.red.withOpacity(0.2),
                  onSelected: (val) => setTicketState(() => selectedPriority = 'URGENT'),
                ),
              ],
            ),
            const SizedBox(height: 20),

            ElevatedButton(
              onPressed: () async {
                if (formKey.currentState?.validate() != true) return;

                final ticket = await ref.read(authProvider.notifier).submitSupportTicket(
                  category: selectedCategory,
                  subject: subjectController.text.trim(),
                  description: descriptionController.text.trim(),
                  rideId: rideIdController.text.trim().isNotEmpty ? rideIdController.text.trim() : null,
                  priority: selectedPriority,
                );

                if (context.mounted) {
                  showDialog(
                    context: context,
                    builder: (dCtx) => AlertDialog(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      title: Row(
                        children: const [
                          Icon(Icons.check_circle_rounded, color: Color(0xFF10B981)),
                          SizedBox(width: 8),
                          Text('Ticket Raised!'),
                        ],
                      ),
                      content: Text(
                        'Your ticket #${ticket?['ticketNumber'] ?? 'RN-TKT'} has been registered. You can track its status in the "My Tickets" tab.',
                        style: const TextStyle(fontSize: 14),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () {
                            Navigator.pop(dCtx);
                            Navigator.pop(context); // Close sheet
                          },
                          child: const Text('Done'),
                        ),
                      ],
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFACC15),
                foregroundColor: Colors.black,
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Submit Ticket', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMyTicketsTab(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: ref.read(authProvider.notifier).fetchSupportTickets(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(color: Color(0xFFFACC15)));
        }
        final tickets = snapshot.data ?? [];
        if (tickets.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.inbox_outlined, size: 48, color: Colors.grey),
                SizedBox(height: 12),
                Text('No support tickets yet', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                SizedBox(height: 4),
                Text('Tickets raised by you will appear here.', style: TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.symmetric(vertical: 8),
          itemCount: tickets.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (ctx, idx) {
            final t = tickets[idx];
            final ticketNum = t['ticketNumber'] ?? 'RN-TKT';
            final status = t['status'] ?? 'OPEN';
            final subject = t['subject'] ?? 'Query';
            final category = t['category'] ?? 'General';
            final date = t['createdAt']?.toString().split('T').first ?? 'Recent';

            Color statusColor = Colors.orange;
            if (status == 'RESOLVED' || status == 'CLOSED') {
              statusColor = Colors.green;
            } else if (status == 'OPEN') {
              statusColor = Colors.blue;
            }

            return ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              title: Row(
                children: [
                  Text(ticketNum, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      status,
                      style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 4),
                  Text(subject, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)),
                  Text('$category • $date', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                ],
              ),
              trailing: const Icon(Icons.chevron_right, color: Colors.grey),
              onTap: () {
                showDialog(
                  context: context,
                  builder: (dCtx) => AlertDialog(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    title: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(ticketNum, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(status, style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    content: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Subject: $subject', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 6),
                        Text(t['description'] ?? 'No description provided.', style: const TextStyle(fontSize: 13, color: Colors.black87)),
                        const SizedBox(height: 12),
                        const Divider(),
                        const Text('Support Updates:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey)),
                        const SizedBox(height: 6),
                        Text(
                          t['responses'] != null && (t['responses'] as List).isNotEmpty
                              ? (t['responses'] as List).last['message']
                              : 'Ticket is being reviewed by our customer care team.',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF1E293B)),
                        ),
                      ],
                    ),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(dCtx), child: const Text('Close')),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
  }

  // =========================================================================
  // 3. NOTIFICATIONS PREFERENCES (Push, Ride Booking, Arrival, Status, Promo, SMS)
  // =========================================================================
  void _showNotificationsDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      backgroundColor: Colors.white,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Notification Preferences',
                style: TextStyle(fontSize: 19, fontWeight: FontWeight.bold, color: Colors.black87),
              ),
              const SizedBox(height: 4),
              const Text(
                'Control which notifications you receive on your phone',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 16),

              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Push Notifications (Master)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                subtitle: const Text('Enable or disable all app notifications'),
                value: _pushNotifications,
                activeColor: const Color(0xFFF59E0B),
                onChanged: (val) {
                  setModalState(() => _pushNotifications = val);
                  setState(() => _pushNotifications = val);
                  _persistNotificationPrefs();
                },
              ),
              const Divider(height: 1),

              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Ride Booking & Confirmation', style: TextStyle(fontSize: 14)),
                subtitle: const Text('Instant updates when a ride is requested and confirmed'),
                value: _rideBookingAlerts,
                activeColor: const Color(0xFFF59E0B),
                onChanged: _pushNotifications ? (val) {
                  setModalState(() => _rideBookingAlerts = val);
                  setState(() => _rideBookingAlerts = val);
                  _persistNotificationPrefs();
                } : null,
              ),

              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Driver Arrival Alerts', style: TextStyle(fontSize: 14)),
                subtitle: const Text('Notifications when driver reaches your pickup point'),
                value: _driverArrivalAlerts,
                activeColor: const Color(0xFFF59E0B),
                onChanged: _pushNotifications ? (val) {
                  setModalState(() => _driverArrivalAlerts = val);
                  setState(() => _driverArrivalAlerts = val);
                  _persistNotificationPrefs();
                } : null,
              ),

              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Live Trip Status Updates', style: TextStyle(fontSize: 14)),
                subtitle: const Text('Trip started, route changes and destination arrival'),
                value: _rideStatusAlerts,
                activeColor: const Color(0xFFF59E0B),
                onChanged: _pushNotifications ? (val) {
                  setModalState(() => _rideStatusAlerts = val);
                  setState(() => _rideStatusAlerts = val);
                  _persistNotificationPrefs();
                } : null,
              ),

              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Payment & Invoices', style: TextStyle(fontSize: 14)),
                subtitle: const Text('Digital ride receipts and wallet balance deductions'),
                value: _paymentAlerts,
                activeColor: const Color(0xFFF59E0B),
                onChanged: _pushNotifications ? (val) {
                  setModalState(() => _paymentAlerts = val);
                  setState(() => _paymentAlerts = val);
                  _persistNotificationPrefs();
                } : null,
              ),

              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Promotional & Discounts', style: TextStyle(fontSize: 14)),
                subtitle: const Text('Exclusive coupon codes and special festival offers'),
                value: _promotionalAlerts,
                activeColor: const Color(0xFFF59E0B),
                onChanged: _pushNotifications ? (val) {
                  setModalState(() => _promotionalAlerts = val);
                  setState(() => _promotionalAlerts = val);
                  _persistNotificationPrefs();
                } : null,
              ),

              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('SMS Updates', style: TextStyle(fontSize: 14)),
                subtitle: const Text('Receive ride OTPs and booking receipts via SMS'),
                value: _smsUpdates,
                activeColor: const Color(0xFFF59E0B),
                onChanged: (val) {
                  setModalState(() => _smsUpdates = val);
                  setState(() => _smsUpdates = val);
                  _persistNotificationPrefs();
                },
              ),
              const SizedBox(height: 12),

              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, size: 16, color: Colors.grey),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Notification preferences are saved locally and synced with your RideNow account.',
                        style: TextStyle(fontSize: 11, color: Colors.black54),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _persistNotificationPrefs() {
    final prefsMap = {
      'pushNotifications': _pushNotifications,
      'rideBookingAlerts': _rideBookingAlerts,
      'driverArrivalAlerts': _driverArrivalAlerts,
      'rideStatusAlerts': _rideStatusAlerts,
      'paymentAlerts': _paymentAlerts,
      'promotionalAlerts': _promotionalAlerts,
      'smsUpdates': _smsUpdates,
    };
    ref.read(storageServiceProvider).saveNotificationPreferences(prefsMap);
    ref.read(authProvider.notifier).updateCustomerProfile(
      notificationPreferences: prefsMap,
    );
  }

  // =========================================================================
  // 4. THEME SWITCHER (Light, Dark, System Default, App-Wide Persistence)
  // =========================================================================
  void _showThemeDialog(BuildContext context) {
    final currentThemeMode = ref.watch(themeModeProvider);

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      backgroundColor: Colors.white,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Select Theme',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
            const SizedBox(height: 12),
            RadioListTile<ThemeMode>(
              title: const Text('Light Theme', style: TextStyle(color: Colors.black87)),
              subtitle: const Text('Clean white surface and yellow highlights', style: TextStyle(fontSize: 12)),
              value: ThemeMode.light,
              groupValue: currentThemeMode,
              activeColor: const Color(0xFFF59E0B),
              onChanged: (val) {
                if (val != null) {
                  ref.read(themeModeProvider.notifier).setThemeMode(val);
                  Navigator.pop(ctx);
                }
              },
            ),
            RadioListTile<ThemeMode>(
              title: const Text('Dark Theme', style: TextStyle(color: Colors.black87)),
              subtitle: const Text('OLED Cyber Black and gold branding', style: TextStyle(fontSize: 12)),
              value: ThemeMode.dark,
              groupValue: currentThemeMode,
              activeColor: const Color(0xFFF59E0B),
              onChanged: (val) {
                if (val != null) {
                  ref.read(themeModeProvider.notifier).setThemeMode(val);
                  Navigator.pop(ctx);
                }
              },
            ),
            RadioListTile<ThemeMode>(
              title: const Text('System Default', style: TextStyle(color: Colors.black87)),
              subtitle: const Text('Adapts dynamically to system settings', style: TextStyle(fontSize: 12)),
              value: ThemeMode.system,
              groupValue: currentThemeMode,
              activeColor: const Color(0xFFF59E0B),
              onChanged: (val) {
                if (val != null) {
                  ref.read(themeModeProvider.notifier).setThemeMode(val);
                  Navigator.pop(ctx);
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  // =========================================================================
  // 5. FAVOURITE LOCATIONS (Home, Work, Custom Saved Places, Add, Edit, Delete)
  // =========================================================================
  void _showFavoritesDialog(BuildContext context) {
    final authState = ref.read(authProvider);
    final user = authState.user;
    final customerProfile = user?.customerProfile ?? {};
    final storage = ref.read(storageServiceProvider);

    String currentHome = customerProfile['homeAddress'] ?? 'Vijay Nagar, Indore, Madhya Pradesh';
    String currentWork = customerProfile['workAddress'] ?? 'Palasia, Indore, Madhya Pradesh';
    List<Map<String, dynamic>> customPlaces = List<Map<String, dynamic>>.from(
      customerProfile['favouriteLocations'] ?? storage.getFavouriteLocations(),
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      backgroundColor: Colors.white,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setFavState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 16,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Favorite Places',
                      style: TextStyle(fontSize: 19, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    TextButton.icon(
                      onPressed: () {
                        _showAddCustomPlaceDialog(context, (name, address) {
                          setFavState(() {
                            customPlaces.add({'name': name, 'address': address});
                          });
                          ref.read(authProvider.notifier).updateCustomerProfile(
                            favouriteLocations: customPlaces,
                          );
                        });
                      },
                      icon: const Icon(Icons.add, size: 18, color: Color(0xFFD97706)),
                      label: const Text('Add Place', style: TextStyle(color: Color(0xFFD97706), fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Home
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFEFF6FF),
                    child: Icon(Icons.home_outlined, color: Colors.blue),
                  ),
                  title: const Text('Home', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  subtitle: Text(currentHome, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  trailing: IconButton(
                    icon: const Icon(Icons.edit_outlined, size: 20, color: Colors.grey),
                    onPressed: () {
                      _showEditAddressDialog(context, 'Edit Home Address', currentHome, (newVal) {
                        setFavState(() => currentHome = newVal);
                        ref.read(authProvider.notifier).updateCustomerProfile(homeAddress: newVal);
                      });
                    },
                  ),
                ),
                const Divider(),

                // Work
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFFFFBEB),
                    child: Icon(Icons.work_outline, color: Colors.orange),
                  ),
                  title: const Text('Work', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  subtitle: Text(currentWork, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  trailing: IconButton(
                    icon: const Icon(Icons.edit_outlined, size: 20, color: Colors.grey),
                    onPressed: () {
                      _showEditAddressDialog(context, 'Edit Work Address', currentWork, (newVal) {
                        setFavState(() => currentWork = newVal);
                        ref.read(authProvider.notifier).updateCustomerProfile(workAddress: newVal);
                      });
                    },
                  ),
                ),

                // Custom Places
                if (customPlaces.isNotEmpty) ...[
                  const Divider(),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 6),
                    child: Text('OTHER SAVED PLACES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.8)),
                  ),
                  ...customPlaces.map((place) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const CircleAvatar(
                      backgroundColor: Color(0xFFF3F4F6),
                      child: Icon(Icons.place_outlined, color: Colors.black87),
                    ),
                    title: Text(place['name'] ?? 'Place', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    subtitle: Text(place['address'] ?? '', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline, size: 20, color: Colors.red),
                      onPressed: () {
                        setFavState(() {
                          customPlaces.remove(place);
                        });
                        ref.read(authProvider.notifier).updateCustomerProfile(
                          favouriteLocations: customPlaces,
                        );
                      },
                    ),
                  )),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showEditAddressDialog(BuildContext context, String title, String currentVal, Function(String) onSave) {
    final controller = TextEditingController(text: currentVal);
    showDialog(
      context: context,
      builder: (dCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: TextField(
          controller: controller,
          decoration: InputDecoration(
            hintText: 'Enter new address',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dCtx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                onSave(controller.text.trim());
                Navigator.pop(dCtx);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFACC15), foregroundColor: Colors.black),
            child: const Text('Update'),
          ),
        ],
      ),
    );
  }

  void _showAddCustomPlaceDialog(BuildContext context, Function(String, String) onAdd) {
    final nameCtrl = TextEditingController();
    final addressCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (dCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Add Favourite Place', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: InputDecoration(
                hintText: 'Label (e.g. Gym, Parents, College)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: addressCtrl,
              decoration: InputDecoration(
                hintText: 'Complete Address / Landmark',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dCtx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              if (nameCtrl.text.trim().isNotEmpty && addressCtrl.text.trim().isNotEmpty) {
                onAdd(nameCtrl.text.trim(), addressCtrl.text.trim());
                Navigator.pop(dCtx);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFACC15), foregroundColor: Colors.black),
            child: const Text('Save Place'),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // 6. SECURITY: CHANGE PASSWORD & ACCOUNT DELETION
  // =========================================================================
  void _showChangePasswordDialog(BuildContext context) {
    final currentPassCtrl = TextEditingController();
    final newPassCtrl = TextEditingController();
    final confirmPassCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (dCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Change Password', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: currentPassCtrl,
                obscureText: true,
                decoration: InputDecoration(
                  hintText: 'Current Password',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                validator: (val) => (val == null || val.isEmpty) ? 'Enter current password' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: newPassCtrl,
                obscureText: true,
                decoration: InputDecoration(
                  hintText: 'New Password (min 6 characters)',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                validator: (val) => (val == null || val.length < 6) ? 'Password must be at least 6 characters' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: confirmPassCtrl,
                obscureText: true,
                decoration: InputDecoration(
                  hintText: 'Confirm New Password',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                validator: (val) {
                  if (val != newPassCtrl.text) return 'Passwords do not match';
                  return null;
                },
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dCtx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (formKey.currentState?.validate() != true) return;
              Navigator.pop(dCtx);
              final success = await ref.read(authProvider.notifier).changePassword(
                currentPassCtrl.text.trim(),
                newPassCtrl.text.trim(),
              );
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success ? 'Password updated successfully!' : 'Failed to update password.'),
                    backgroundColor: success ? const Color(0xFF10B981) : Colors.red,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFACC15), foregroundColor: Colors.black),
            child: const Text('Update Password'),
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context) {
    String selectedReason = 'Found a better alternative';
    showDialog(
      context: context,
      builder: (dCtx) => StatefulBuilder(
        builder: (dCtx, setDState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: const [
              Icon(Icons.warning_amber_rounded, color: Colors.red),
              SizedBox(width: 8),
              Text('Delete Account', style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Are you sure you want to delete your RideNow account? This will permanently delete your booking history, saved locations, and remaining wallet balance.',
                style: TextStyle(fontSize: 13, color: Colors.black87),
              ),
              const SizedBox(height: 14),
              const Text('Reason for leaving:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: selectedReason,
                isExpanded: true,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                ),
                items: const [
                  DropdownMenuItem(value: 'Found a better alternative', child: Text('Found a better alternative', style: TextStyle(fontSize: 12))),
                  DropdownMenuItem(value: 'Privacy & Data concerns', child: Text('Privacy & Data concerns', style: TextStyle(fontSize: 12))),
                  DropdownMenuItem(value: 'App issues & bugs', child: Text('App issues & bugs', style: TextStyle(fontSize: 12))),
                  DropdownMenuItem(value: 'No longer needed', child: Text('No longer needed', style: TextStyle(fontSize: 12))),
                  DropdownMenuItem(value: 'Other', child: Text('Other reason', style: TextStyle(fontSize: 12))),
                ],
                onChanged: (val) {
                  if (val != null) setDState(() => selectedReason = val);
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dCtx),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(dCtx);
                final success = await ref.read(authProvider.notifier).deleteAccountRequest(selectedReason);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(success
                          ? 'Account deletion requested. Our team will process it within 7 days.'
                          : 'Request submitted.'),
                      backgroundColor: Colors.black87,
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
              child: const Text('Confirm Deletion'),
            ),
          ],
        ),
      ),
    );
  }

  // =========================================================================
  // 7. PRIVACY POLICY & TERMS OF SERVICE VIEWER
  // =========================================================================
  void _showTermsSheet(BuildContext context, {required bool isTerms}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  isTerms ? 'Terms & Conditions' : 'Privacy Policy',
                  style: const TextStyle(fontSize: 19, fontWeight: FontWeight.bold, color: Colors.black87),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: Colors.grey),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const Divider(),
            Expanded(
              child: SingleChildScrollView(
                child: Text(
                  isTerms
                      ? '''1. ACCEPTANCE OF TERMS
By accessing or using the RideNow mobility platform ("RideNow", "we", "us"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access our ride-booking services.

2. SERVICE ELIGIBILITY
You must be at least 18 years old to create an account and book rides. You agree to provide accurate, current, and complete registration information.

3. RIDE BOOKING AND FARES
All fares displayed are calculated transparently based on distance, vehicle category, and local regulations. RideNow does not charge artificial commission surges. Payment must be completed upon ride completion via Cash, UPI, or in-app Wallet.

4. USER CONDUCT & SAFETY
Users agree to treat drivers and vehicles with respect. Damaging vehicle property, verbal abuse, or refusing to pay valid fares will lead to permanent account suspension.

5. CANCELLATIONS & REFUNDS
Riders can cancel rides free of charge within 3 minutes of driver acceptance. Subsequent cancellations may incur a nominal cancellation fee credited to the driver.

6. GOVERNING LAW & GRIEVANCE
These terms are governed by the laws of India. Grievance Officer: grievance@ridenow.in.'''
                      : '''1. INFORMATION WE COLLECT
RideNow collects information you provide directly to us (name, mobile number, email address), location data required for pickup and route navigation, and transaction records.

2. HOW WE USE INFORMATION
We use your information exclusively to:
- Connect you with nearby drivers for trip fulfillment.
- Calculate accurate route navigation and fares.
- Provide customer support and resolve tickets.
- Ensure passenger safety via emergency SOS features.

3. DATA PROTECTION & SHARING
RideNow does not sell your personal data to third-party advertisers. Driver partners only see masked phone identifiers and your designated pickup/drop coordinates.

4. USER RIGHTS
You retain full rights to update your personal information, configure notification preferences, or request complete account deletion at any time from your profile screen.

5. CONTACT US
For privacy questions, reach us at privacy@ridenow.in.''',
                  style: const TextStyle(fontSize: 13, height: 1.5, color: Colors.black87),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // =========================================================================
  // 8. SAFETY SHEET
  // =========================================================================
  void _showSafetySheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      backgroundColor: Colors.white,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: const [
                Icon(Icons.shield_rounded, color: Colors.green, size: 28),
                SizedBox(width: 10),
                Text(
                  'Safety Toolkit',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              'Your safety is our topmost priority on every single ride.',
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                _makeCall(EnvironmentConfig.emergencySosNumber);
              },
              icon: const Icon(Icons.emergency, color: Colors.white),
              label: Text(
                'Emergency SOS (${EnvironmentConfig.emergencySosNumber})',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                  color: Colors.white,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red[600],
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Live trip location link shared with emergency contacts.')),
                );
              },
              icon: const Icon(Icons.share_location_rounded, color: Colors.black87),
              label: const Text(
                'Share Live Trip Status',
                style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w600),
              ),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // =========================================================================
  // 9. PAYMENT & WALLET SHEET
  // =========================================================================
  void _showPaymentSheet(BuildContext context, double balance) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      backgroundColor: Colors.white,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Payment & Wallet',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFBBF24), Color(0xFFF59E0B)],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('RideNow Wallet', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 4),
                      Text(
                        '₹${balance.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black),
                      ),
                    ],
                  ),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Razorpay top-up gateway initializing...')),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Add Money'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            const Text('Payment Modes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey)),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.qr_code_2_rounded, color: Colors.blue),
              title: const Text('UPI (GPay / PhonePe / Paytm)', style: TextStyle(fontWeight: FontWeight.w500)),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.pop(ctx),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.credit_card_rounded, color: Colors.purple),
              title: const Text('Credit & Debit Cards', style: TextStyle(fontWeight: FontWeight.w500)),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.pop(ctx),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.money_rounded, color: Colors.green),
              title: const Text('Cash on Delivery', style: TextStyle(fontWeight: FontWeight.w500)),
              trailing: const Icon(Icons.check, color: Colors.green),
              onTap: () => Navigator.pop(ctx),
            ),
          ],
        ),
      ),
    );
  }

  // =========================================================================
  // 10. REFER & EARN
  // =========================================================================
  void _showReferAndEarn(BuildContext context, [String referralCode = 'ASHISH50']) {
    final referralLink = 'https://ridenow.in/invite?ref=$referralCode';
    final inviteMessage = 'Hey! Join RideNow using my link for safe, fast and affordable bike and car taxi rides in India. Get flat ₹50 OFF on your first ride: $referralLink';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 14,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.card_giftcard_rounded, color: Color(0xFFF59E0B), size: 26),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('Refer & Earn ₹50', style: TextStyle(fontSize: 19, fontWeight: FontWeight.bold, color: Colors.black87)),
                        SizedBox(height: 2),
                        Text('Invite friends & earn RideNow credits', style: TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(ctx),
                    icon: const Icon(Icons.close_rounded, color: Colors.grey),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.confirmation_number_outlined, color: Color(0xFFF59E0B), size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        referralCode,
                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, letterSpacing: 2.0, color: Colors.black87),
                      ),
                    ),
                    InkWell(
                      onTap: () {
                        Clipboard.setData(ClipboardData(text: referralCode));
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Referral code "$referralCode" copied!')));
                      },
                      child: const Text('Copy', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF2563EB))),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () async {
                  final whatsappUrl = Uri.parse('whatsapp://send?text=${Uri.encodeComponent(inviteMessage)}');
                  if (await canLaunchUrl(whatsappUrl)) {
                    await launchUrl(whatsappUrl);
                  } else {
                    Clipboard.setData(ClipboardData(text: inviteMessage));
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invite copied to clipboard!')));
                    }
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF25D366),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18),
                label: const Text('Share on WhatsApp', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // =========================================================================
  // 11. ABOUT DIALOG & SIGN OUT CONFIRMATION
  // =========================================================================
  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            RideNowLogo(height: 24),
            SizedBox(width: 8),
            Text('About RideNow', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('RideNow App v2.4.0 (Build 2026)', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text(
              'Smart, affordable and safe urban rides powered by real-time matching and local driver partners in India.',
              style: TextStyle(fontSize: 13, color: Colors.black87),
            ),
            SizedBox(height: 12),
            Text('© 2026 RideNow Mobility Pvt Ltd.\nAll rights reserved.', style: TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
        ],
      ),
    );
  }

  void _confirmSignOut(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to sign out of your RideNow account?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                context.go('/');
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
            ),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final customerProfile = user?.customerProfile;
    final walletBalance = (customerProfile?['walletBalance'] as num?)?.toDouble() ?? 750.0;

    final displayName = (user?.fullName.isNotEmpty == true) ? user!.fullName : 'ashish';
    final displayPhone = (user?.phone.isNotEmpty == true) ? user!.phone : '9977309415';
    final cleanName = displayName.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '').toUpperCase();
    final referralCode = cleanName.isNotEmpty
        ? '${cleanName.substring(0, cleanName.length > 6 ? 6 : cleanName.length)}50'
        : 'ASHISH50';

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF070709) : const Color(0xFFF4F6F9),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0E0E13) : const Color(0xFFF4F6F9),
        elevation: 0,
        centerTitle: true,
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: Icon(Icons.arrow_back_ios_new_rounded, color: isDark ? Colors.white : Colors.black, size: 20),
                onPressed: () => context.pop(),
              )
            : null,
        title: Text(
          'Profile',
          style: TextStyle(
            color: isDark ? Colors.white : Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
        child: Column(
          children: [
            // ----------------------------------------------------
            // 1. Top Card: User Profile info & My Rating
            // ----------------------------------------------------
            Container(
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF141418) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Row 1: Silhouette Avatar, Name, Phone, Edit Profile
                  InkWell(
                    onTap: () => _showEditProfileSheet(context),
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      child: Row(
                        children: [
                          Container(
                            width: 58,
                            height: 58,
                            decoration: const BoxDecoration(
                              color: Color(0xFF9E9E9E),
                              shape: BoxShape.circle,
                            ),
                            child: const Center(
                              child: Icon(Icons.person, size: 38, color: Colors.white),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Flexible(
                                      child: Text(
                                        displayName,
                                        style: TextStyle(
                                          fontSize: 17,
                                          fontWeight: FontWeight.w700,
                                          color: isDark ? Colors.white : Colors.black,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    const Icon(Icons.edit_outlined, size: 16, color: Color(0xFFF59E0B)),
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  displayPhone,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                    color: Color(0xFF6B7280),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right_rounded, color: Color(0xFFC7C7CC), size: 24),
                        ],
                      ),
                    ),
                  ),

                  Divider(height: 1, thickness: 0.6, color: isDark ? Colors.white12 : const Color(0xFFE5E7EB)),

                  // Row 2: Star, 4.20 My Rating
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    child: Row(
                      children: [
                        const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 22),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            '4.20 My Rating',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.white70 : Colors.black87,
                            ),
                          ),
                        ),
                        const Icon(Icons.chevron_right_rounded, color: Color(0xFFC7C7CC), size: 24),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // ----------------------------------------------------
            // 2. Menu Card (Comprehensive, fully functional items)
            // ----------------------------------------------------
            Container(
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF141418) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Column(
                  children: [
                    // 1. Help & Support
                    _buildMenuItem(
                      icon: Icons.help_outline_rounded,
                      title: 'Help & Support',
                      onTap: () => _showHelpCenterSheet(context),
                      isDark: isDark,
                    ),
                    _buildDivider(isDark),

                    // 2. My Rides
                    _buildMenuItem(
                      icon: Icons.history_rounded,
                      title: 'My Rides',
                      onTap: () => context.push('/rider/history'),
                      isDark: isDark,
                    ),
                    _buildDivider(isDark),

                    // 3. Payment & Wallet
                    _buildMenuItem(
                      icon: Icons.payments_outlined,
                      title: 'Payment',
                      onTap: () => _showPaymentSheet(context, walletBalance),
                      isDark: isDark,
                    ),
                    _buildDivider(isDark),

                    // 4. Safety
                    _buildMenuItem(
                      icon: Icons.shield_outlined,
                      title: 'Safety',
                      onTap: () => _showSafetySheet(context),
                      isDark: isDark,
                    ),
                    _buildDivider(isDark),

                    // 5. Refer and Earn
                    _buildMenuItem(
                      icon: Icons.card_giftcard_rounded,
                      title: 'Refer and Earn',
                      onTap: () => _showReferAndEarn(context, referralCode),
                      isDark: isDark,
                    ),
                    _buildDivider(isDark),

                    // 6. Notifications
                    _buildMenuItem(
                      icon: Icons.notifications_none_rounded,
                      title: 'Notifications',
                      onTap: () => _showNotificationsDialog(context),
                      isDark: isDark,
                    ),
                    _buildDivider(isDark),

                    // 7. Favorites
                    _buildMenuItem(
                      icon: Icons.favorite_border_rounded,
                      title: 'Favorites',
                      onTap: () => _showFavoritesDialog(context),
                      isDark: isDark,
                    ),
                    _buildDivider(isDark),

                    // 8. Theme
                    _buildMenuItem(
                      icon: Icons.contrast_rounded,
                      title: 'Theme',
                      onTap: () => _showThemeDialog(context),
                      isDark: isDark,
                    ),
                    _buildDivider(isDark),

                    // 9. Change Password
                    _buildMenuItem(
                      icon: Icons.lock_outline_rounded,
                      title: 'Change Password',
                      onTap: () => _showChangePasswordDialog(context),
                      isDark: isDark,
                    ),
                    _buildDivider(isDark),

                    // 10. Terms & Conditions
                    _buildMenuItem(
                      icon: Icons.description_outlined,
                      title: 'Terms & Conditions',
                      onTap: () => _showTermsSheet(context, isTerms: true),
                      isDark: isDark,
                    ),
                    _buildDivider(isDark),

                    // 11. Privacy Policy
                    _buildMenuItem(
                      icon: Icons.privacy_tip_outlined,
                      title: 'Privacy Policy',
                      onTap: () => _showTermsSheet(context, isTerms: false),
                      isDark: isDark,
                    ),
                    _buildDivider(isDark),

                    // 12. About
                    _buildMenuItem(
                      icon: Icons.info_outline_rounded,
                      title: 'About',
                      onTap: () => _showAboutDialog(context),
                      isDark: isDark,
                    ),
                    _buildDivider(isDark),

                    // 13. Delete Account Request
                    _buildMenuItem(
                      icon: Icons.person_remove_outlined,
                      title: 'Delete Account',
                      textColor: Colors.red[400],
                      onTap: () => _showDeleteAccountDialog(context),
                      isDark: isDark,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 18),

            // ----------------------------------------------------
            // 3. Log Out Button
            // ----------------------------------------------------
            Material(
              color: isDark ? const Color(0xFF141418) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              elevation: 0,
              child: ListTile(
                onTap: () => _confirmSignOut(context),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                leading: const Icon(Icons.logout_rounded, color: Color(0xFFEF4444), size: 22),
                title: const Text(
                  'Log Out',
                  style: TextStyle(
                    color: Color(0xFFEF4444),
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
                trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFFC7C7CC), size: 22),
              ),
            ),

            const SizedBox(height: 24),
            Center(
              child: Column(
                children: const [
                  RideNowLogo(height: 28),
                  SizedBox(height: 6),
                  Text(
                    'RideNow v2.4.0 • Made with ❤️ in India',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    required bool isDark,
    Color? textColor,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(
          children: [
            Icon(
              icon,
              size: 22,
              color: textColor ?? (isDark ? Colors.white70 : const Color(0xFF374151)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: textColor ?? (isDark ? Colors.white : const Color(0xFF1F2937)),
                ),
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFFC7C7CC), size: 22),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider(bool isDark) {
    return Divider(
      height: 1,
      thickness: 0.5,
      indent: 52,
      color: isDark ? Colors.white10 : const Color(0xFFF3F4F6),
    );
  }
}
