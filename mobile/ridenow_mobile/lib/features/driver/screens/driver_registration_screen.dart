import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/widgets/ridenow_logo.dart';
import '../providers/driver_verification_provider.dart';

class DriverRegistrationScreen extends ConsumerStatefulWidget {
  const DriverRegistrationScreen({super.key});

  @override
  ConsumerState<DriverRegistrationScreen> createState() =>
      _DriverRegistrationScreenState();
}

class _DriverRegistrationScreenState
    extends ConsumerState<DriverRegistrationScreen> {
  int _currentStep = 0;

  // Step 1: Mobile & OTP
  final _phoneCtrl = TextEditingController(text: '+919877665544');
  final _otpCtrl = TextEditingController(text: '123456');
  bool _otpSent = true;
  bool _isVerifyingOtp = false;

  // Step 2: Personal Info
  final _nameCtrl = TextEditingController(text: 'Rameshwar Yadav');
  final _emailCtrl = TextEditingController(text: 'rameshwar@driver.in');
  DateTime _dob = DateTime(1995, 5, 15);
  final _addressCtrl = TextEditingController(
      text: 'Sector B, Vijay Nagar, Indore, Madhya Pradesh');
  String _profilePhotoUrl =
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';

  // Step 3: Vehicle Info
  String _selectedCategory = 'BIKE'; // 'BIKE' | 'CAR'
  final _makeModelCtrl = TextEditingController(text: 'Hero Splendor Plus');
  final _regNumCtrl = TextEditingController(text: 'MP 09 RN 7711');
  final _colorCtrl = TextEditingController(text: 'Black');
  int _mfgYear = 2024;

  // Step 4: Documents state
  final Map<String, String> _docFiles = {
    'DRIVING_LICENSE':
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    'VEHICLE_RC':
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    'VEHICLE_INSURANCE':
        'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
    'PUC_CERTIFICATE':
        'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
    'IDENTITY_PROOF':
        'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=600&q=80',
    'DRIVER_SELFIE':
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'VEHICLE_PHOTO':
        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
  };

  final Map<String, String> _docExpiry = {
    'DRIVING_LICENSE': '2030-12-31',
    'VEHICLE_INSURANCE': '2027-06-30',
    'PUC_CERTIFICATE': '2026-11-30',
  };

  final Map<String, String> _docNumbers = {
    'DRIVING_LICENSE': 'DL-042019-887711',
    'VEHICLE_RC': 'RC-MP09-7711-2024',
    'VEHICLE_INSURANCE': 'INS-HDFC-992211',
    'PUC_CERTIFICATE': 'PUC-MP-883344',
    'IDENTITY_PROOF': 'XXXX-XXXX-9415',
  };

  bool _isSubmitting = false;

  void _onCategoryChanged(String cat) {
    setState(() {
      _selectedCategory = cat;
      if (cat == 'BIKE') {
        _makeModelCtrl.text = 'Hero Splendor Plus';
        _colorCtrl.text = 'Black';
        _docFiles['VEHICLE_PHOTO'] =
            'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80';
      } else {
        _makeModelCtrl.text = 'Maruti Suzuki WagonR';
        _colorCtrl.text = 'White';
        _docFiles['VEHICLE_PHOTO'] =
            'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
      }
    });
  }

  Future<void> _pickDateOfBirth() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dob,
      firstDate: DateTime(1960),
      lastDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
    );
    if (picked != null) {
      setState(() => _dob = picked);
    }
  }

  Future<void> _pickDocExpiry(String docType) async {
    final currentExp = _docExpiry[docType] != null
        ? DateTime.tryParse(_docExpiry[docType]!) ?? DateTime(2027, 1, 1)
        : DateTime(2027, 1, 1);

    final picked = await showDatePicker(
      context: context,
      initialDate: currentExp,
      firstDate: DateTime.now().add(const Duration(days: 1)),
      lastDate: DateTime(2040),
    );

    if (picked != null) {
      setState(() {
        _docExpiry[docType] =
            "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  void _simulateUploadDoc(String docType) {
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
              'Upload $docType',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Accepted formats: PDF, JPG, PNG (Max 5MB). Simulated secure private storage.',
              style: TextStyle(color: Colors.grey, fontSize: 13),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.camera_alt_rounded, color: Colors.blue),
              title: const Text('Capture with Camera (Selfie / Document)'),
              onTap: () {
                Navigator.pop(ctx);
                setState(() {
                  _docFiles[docType] =
                      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80';
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Simulated camera capture for $docType.')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_rounded, color: Colors.green),
              title: const Text('Choose from Gallery / Files'),
              onTap: () {
                Navigator.pop(ctx);
                setState(() {
                  _docFiles[docType] =
                      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80';
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Document file selected for $docType.')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitRegistration() async {
    setState(() => _isSubmitting = true);
    final notifier = ref.read(driverVerificationProvider.notifier);

    // 1. Register Driver Profile
    final ok = await notifier.registerDriver(
      fullName: _nameCtrl.text.trim(),
      phone: _phoneCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      dateOfBirth: DateFormat('yyyy-MM-dd').format(_dob),
      address: _addressCtrl.text.trim(),
      vehicleCategory: _selectedCategory,
      make: _makeModelCtrl.text.split(' ').first,
      model: _makeModelCtrl.text,
      registrationNumber: _regNumCtrl.text.trim(),
      color: _colorCtrl.text.trim(),
      manufacturingYear: _mfgYear,
      profilePhotoUrl: _profilePhotoUrl,
    );

    if (!ok) {
      setState(() => _isSubmitting = false);
      return;
    }

    // 2. Upload All 7 Documents
    for (final docType in mandatoryDocTypes) {
      final fileUrl = _docFiles[docType] ??
          'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80';
      final exp = _docExpiry[docType];
      final docNum = _docNumbers[docType];

      await notifier.uploadDocument(
        documentType: docType,
        documentNumber: docNum,
        fileUrl: fileUrl,
        fileName: '$docType.jpg',
        fileSize: 1024 * 750, // 750KB
        fileType: 'image/jpeg',
        expiryDate: exp,
      );
    }

    setState(() => _isSubmitting = false);

    if (mounted) {
      context.go('/driver/verification');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Row(
          children: const [
            RideNowLogo(height: 28),
            SizedBox(width: 8),
            Text(
              'Partner Onboarding',
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
          onPressed: () {
            if (_currentStep > 0) {
              setState(() => _currentStep--);
            } else {
              context.pop();
            }
          },
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Top Stepper Indicator
            Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                children: [
                  _buildStepPill(0, 'Auth'),
                  _buildStepDivider(0),
                  _buildStepPill(1, 'Profile'),
                  _buildStepDivider(1),
                  _buildStepPill(2, 'Vehicle'),
                  _buildStepDivider(2),
                  _buildStepPill(3, 'Docs'),
                  _buildStepDivider(3),
                  _buildStepPill(4, 'Review'),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: _buildCurrentStepView(),
              ),
            ),

            // Bottom Action Bar
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _handleNextStep,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryYellow,
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.black,
                          ),
                        )
                      : Text(
                          _currentStep == 4
                              ? 'Submit for Compliance Approval'
                              : 'Continue to ${_getStepTitle(_currentStep + 1)}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepPill(int step, String label) {
    final isActive = _currentStep == step;
    final isDone = _currentStep > step;

    return Row(
      children: [
        CircleAvatar(
          radius: 12,
          backgroundColor: isDone
              ? const Color(0xFF10B981)
              : isActive
                  ? AppTheme.primaryYellow
                  : const Color(0xFFE2E8F0),
          child: isDone
              ? const Icon(Icons.check, size: 14, color: Colors.white)
              : Text(
                  '${step + 1}',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: isActive ? Colors.black : const Color(0xFF64748B),
                  ),
                ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
            color: isActive ? Colors.black : const Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildStepDivider(int step) {
    final isDone = _currentStep > step;
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        color: isDone ? const Color(0xFF10B981) : const Color(0xFFE2E8F0),
      ),
    );
  }

  String _getStepTitle(int step) {
    switch (step) {
      case 0:
        return 'Mobile Auth';
      case 1:
        return 'Personal Info';
      case 2:
        return 'Vehicle Details';
      case 3:
        return 'Document Upload';
      case 4:
        return 'Verification Review';
      default:
        return 'Next';
    }
  }

  void _handleNextStep() {
    if (_currentStep < 4) {
      setState(() => _currentStep++);
    } else {
      _submitRegistration();
    }
  }

  // --- Step 0: Mobile OTP & Firebase Authentication ---
  Widget _buildStep0() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Mobile Authentication',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        const Text(
          'Verify your driver mobile number with Firebase OTP authentication.',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
        ),
        const SizedBox(height: 20),

        // Info box for free Firebase Spark support
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFBFDBFE)),
          ),
          child: Row(
            children: const [
              Icon(Icons.info_outline, color: Color(0xFF2563EB), size: 20),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Development & Test Mode: Free Firebase OTP supported using test numbers (e.g. +91 9877665544 with code 123456).',
                  style: TextStyle(color: Color(0xFF1E40AF), fontSize: 12),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        TextField(
          controller: _phoneCtrl,
          keyboardType: TextInputType.phone,
          decoration: InputDecoration(
            labelText: 'Driver Mobile Number',
            prefixIcon: const Icon(Icons.phone_android_rounded),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 16),

        if (_otpSent) ...[
          TextField(
            controller: _otpCtrl,
            keyboardType: TextInputType.number,
            maxLength: 6,
            decoration: InputDecoration(
              labelText: '6-Digit OTP Code',
              hintText: '123456',
              prefixIcon: const Icon(Icons.security_rounded),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Did not receive code?',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
              TextButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Test OTP: 123456 sent to mobile.')),
                  );
                },
                child: const Text('Resend Test OTP'),
              ),
            ],
          ),
        ],
      ],
    );
  }

  // --- Step 1: Personal Info ---
  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Personal Information',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        const Text(
          'Provide verified personal identity details for commercial driver licensing.',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
        ),
        const SizedBox(height: 20),

        Center(
          child: Stack(
            children: [
              CircleAvatar(
                radius: 46,
                backgroundColor: Colors.grey[200],
                backgroundImage: NetworkImage(_profilePhotoUrl),
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: CircleAvatar(
                  radius: 16,
                  backgroundColor: AppTheme.primaryYellow,
                  child: IconButton(
                    padding: EdgeInsets.zero,
                    icon: const Icon(Icons.camera_alt,
                        size: 16, color: Colors.black),
                    onPressed: () => _simulateUploadDoc('DRIVER_SELFIE'),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        TextField(
          controller: _nameCtrl,
          decoration: InputDecoration(
            labelText: 'Full Name (as per Driving Licence)',
            prefixIcon: const Icon(Icons.person_rounded),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 14),

        TextField(
          controller: _emailCtrl,
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(
            labelText: 'Email Address',
            prefixIcon: const Icon(Icons.email_outlined),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 14),

        // Date of Birth
        InkWell(
          onTap: _pickDateOfBirth,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[400]!),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.cake_outlined, color: Color(0xFF64748B)),
                    const SizedBox(width: 12),
                    Text(
                      'Date of Birth: ${DateFormat('dd MMMM yyyy').format(_dob)}',
                      style: const TextStyle(fontSize: 15),
                    ),
                  ],
                ),
                const Icon(Icons.calendar_today_rounded, size: 18),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),

        TextField(
          controller: _addressCtrl,
          maxLines: 2,
          decoration: InputDecoration(
            labelText: 'Residential Address',
            prefixIcon: const Icon(Icons.home_outlined),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ],
    );
  }

  // --- Step 2: Vehicle Category & Specs ---
  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Vehicle Category & Details',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        const Text(
          'Choose your commercial fleet category: Bike or Car.',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
        ),
        const SizedBox(height: 20),

        // Interactive Category Selector Cards
        Row(
          children: [
            Expanded(
              child: _buildCategoryCard(
                category: 'BIKE',
                title: 'RideNow Bike',
                subtitle: 'Motorcycle & Scooters',
                icon: Icons.two_wheeler_rounded,
                isSelected: _selectedCategory == 'BIKE',
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: _buildCategoryCard(
                category: 'CAR',
                title: 'RideNow Car',
                subtitle: 'Sedan, Hatchback & SUV',
                icon: Icons.directions_car_rounded,
                isSelected: _selectedCategory == 'CAR',
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        TextField(
          controller: _regNumCtrl,
          textCapitalization: TextCapitalization.characters,
          decoration: InputDecoration(
            labelText: 'Registration Number (Number Plate)',
            hintText: 'e.g. MP 09 RN 7711',
            prefixIcon: const Icon(Icons.pin_outlined),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 14),

        TextField(
          controller: _makeModelCtrl,
          decoration: InputDecoration(
            labelText: 'Vehicle Make & Model',
            hintText: _selectedCategory == 'BIKE'
                ? 'Hero Splendor / Honda Activa'
                : 'Maruti Suzuki WagonR / Swift',
            prefixIcon: const Icon(Icons.drive_file_rename_outline),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 14),

        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _colorCtrl,
                decoration: InputDecoration(
                  labelText: 'Vehicle Colour',
                  prefixIcon: const Icon(Icons.color_lens_outlined),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: DropdownButtonFormField<int>(
                value: _mfgYear,
                decoration: InputDecoration(
                  labelText: 'Mfg Year',
                  prefixIcon: const Icon(Icons.event_rounded),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                items: [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018]
                    .map((y) => DropdownMenuItem(value: y, child: Text('$y')))
                    .toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _mfgYear = val);
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCategoryCard({
    required String category,
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isSelected,
  }) {
    return InkWell(
      onTap: () => _onCategoryChanged(category),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFEF3C7) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppTheme.primaryYellow : const Color(0xFFE2E8F0),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              icon,
              size: 32,
              color: isSelected ? Colors.black : const Color(0xFF64748B),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
            ),
          ],
        ),
      ),
    );
  }

  // --- Step 3: Mandatory Document Uploads ---
  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Required Compliance Documents',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        const Text(
          'Upload all 7 mandatory documents. Documents are stored in secure private storage.',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
        ),
        const SizedBox(height: 16),

        _buildDocUploadCard(
          docType: 'DRIVING_LICENSE',
          title: '1. Driving Licence (DL)',
          subtitle: 'Commercial / Transport / LMV valid licence',
          hasExpiry: true,
        ),
        _buildDocUploadCard(
          docType: 'VEHICLE_RC',
          title: '2. Registration Certificate (RC)',
          subtitle: 'Vehicle registration proof under MVA 2019',
          hasExpiry: false,
        ),
        _buildDocUploadCard(
          docType: 'VEHICLE_INSURANCE',
          title: '3. Vehicle Insurance Policy',
          subtitle: 'Comprehensive third-party commercial cover',
          hasExpiry: true,
        ),
        _buildDocUploadCard(
          docType: 'PUC_CERTIFICATE',
          title: '4. Pollution Under Control (PUC)',
          subtitle: 'Mandatory emission compliance certificate',
          hasExpiry: true,
        ),
        _buildDocUploadCard(
          docType: 'IDENTITY_PROOF',
          title: '5. Identity Proof (Masked Aadhaar / Voter ID)',
          subtitle: 'Legally permitted identity verification proof',
          hasExpiry: false,
        ),
        _buildDocUploadCard(
          docType: 'DRIVER_SELFIE',
          title: '6. Driver Profile Selfie',
          subtitle: 'Clear front face photograph with plain background',
          hasExpiry: false,
        ),
        _buildDocUploadCard(
          docType: 'VEHICLE_PHOTO',
          title: '7. Vehicle Photograph',
          subtitle: 'Front view displaying registration number plate',
          hasExpiry: false,
        ),
      ],
    );
  }

  Widget _buildDocUploadCard({
    required String docType,
    required String title,
    required String subtitle,
    required bool hasExpiry,
  }) {
    final hasFile = _docFiles[docType] != null;
    final expiry = _docExpiry[docType];

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      style: const TextStyle(
                          color: Color(0xFF64748B), fontSize: 12),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: hasFile
                      ? const Color(0xFFDCFCE7)
                      : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  hasFile ? 'Uploaded' : 'Pending',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: hasFile
                        ? const Color(0xFF16A34A)
                        : const Color(0xFF64748B),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              OutlinedButton.icon(
                onPressed: () => _simulateUploadDoc(docType),
                icon: const Icon(Icons.cloud_upload_outlined, size: 16),
                label: Text(hasFile ? 'Replace Document' : 'Upload File'),
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const Spacer(),
              if (hasExpiry)
                TextButton.icon(
                  onPressed: () => _pickDocExpiry(docType),
                  icon: const Icon(Icons.event_outlined, size: 16),
                  label: Text(
                    expiry != null ? 'Exp: $expiry' : 'Set Expiry',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  // --- Step 4: Summary & Compliance Review ---
  Widget _buildStep4() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Verification Summary',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        const Text(
          'Review details before submitting to RideNow compliance team.',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
        ),
        const SizedBox(height: 16),

        // Driver details card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            children: [
              _buildSummaryRow('Driver Name', _nameCtrl.text),
              const Divider(height: 16),
              _buildSummaryRow('Mobile Number', _phoneCtrl.text),
              const Divider(height: 16),
              _buildSummaryRow(
                  'Date of Birth', DateFormat('dd MMM yyyy').format(_dob)),
              const Divider(height: 16),
              _buildSummaryRow('Category', 'RideNow $_selectedCategory'),
              const Divider(height: 16),
              _buildSummaryRow('Vehicle Model', _makeModelCtrl.text),
              const Divider(height: 16),
              _buildSummaryRow('Registration No.', _regNumCtrl.text),
              const Divider(height: 16),
              _buildSummaryRow('Documents Ready',
                  '${_docFiles.length} of ${mandatoryDocTypes.length} Completed'),
            ],
          ),
        ),
        const SizedBox(height: 16),

        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFFEF3C7),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFFDE68A)),
          ),
          child: Row(
            children: const [
              Icon(Icons.verified_user_rounded,
                  color: Color(0xFFD97706), size: 24),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Automated checks will validate formats and expiry dates. Manual compliance review completes within 2 to 4 hours.',
                  style: TextStyle(color: Color(0xFF92400E), fontSize: 12),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 13)),
        Text(value,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }

  Widget _buildCurrentStepView() {
    switch (_currentStep) {
      case 0:
        return _buildStep0();
      case 1:
        return _buildStep1();
      case 2:
        return _buildStep2();
      case 3:
        return _buildStep3();
      case 4:
        return _buildStep4();
      default:
        return const SizedBox();
    }
  }
}

