import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_theme.dart';
import '../providers/auth_provider.dart';

class DriverSignupScreen extends ConsumerStatefulWidget {
  const DriverSignupScreen({super.key});

  @override
  ConsumerState<DriverSignupScreen> createState() => _DriverSignupScreenState();
}

class _DriverSignupScreenState extends ConsumerState<DriverSignupScreen> {
  final _nameCtrl = TextEditingController(text: 'Rameshwar Yadav');
  final _phoneCtrl = TextEditingController(text: '+919877665544');
  final _emailCtrl = TextEditingController(text: 'rameshwar@driver.in');
  final _passwordCtrl = TextEditingController(text: 'Password@123');
  final _vehicleModelCtrl = TextEditingController(text: 'Bajaj Compact RE');
  final _vehicleNumberCtrl = TextEditingController(text: 'MP-09-RN-7711');
  final _licenseCtrl = TextEditingController(text: 'DL-042019-887711');
  String _category = 'AUTO';

  Future<void> _submit() async {
    final success = await ref
        .read(authProvider.notifier)
        .driverSignup(
          fullName: _nameCtrl.text.trim(),
          phone: _phoneCtrl.text.trim(),
          email: _emailCtrl.text.trim(),
          password: _passwordCtrl.text.trim(),
          vehicleCategory: _category,
          vehicleModel: _vehicleModelCtrl.text.trim(),
          vehicleNumber: _vehicleNumberCtrl.text.trim(),
          licenseNumber: _licenseCtrl.text.trim(),
        );

    if (success && mounted) {
      context.go('/driver/dashboard');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Driver Partner Registration')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Drive & Earn with RideNow',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Register your commercial vehicle for Indian ride-hailing with MVA 2019 compliance.',
                style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
              ),
              const SizedBox(height: 20),

              if (authState.errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.errorRed.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.errorRed),
                  ),
                  child: Text(
                    authState.errorMessage!,
                    style: const TextStyle(
                      color: AppTheme.errorRed,
                      fontSize: 12,
                    ),
                  ),
                ),

              TextField(
                controller: _nameCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Driver Full Name',
                  prefixIcon: Icon(
                    Icons.person_outline,
                    color: AppTheme.primaryYellow,
                  ),
                ),
              ),
              const SizedBox(height: 14),

              TextField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Mobile Number (+91...)',
                  prefixIcon: Icon(
                    Icons.phone_iphone,
                    color: AppTheme.primaryYellow,
                  ),
                ),
              ),
              const SizedBox(height: 14),

              TextField(
                controller: _passwordCtrl,
                obscureText: true,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Password',
                  prefixIcon: Icon(
                    Icons.lock_outline,
                    color: AppTheme.primaryYellow,
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Vehicle Category Picker
              DropdownButtonFormField<String>(
                initialValue: _category,
                dropdownColor: AppTheme.surfaceDark,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
                decoration: const InputDecoration(
                  labelText: 'Vehicle Fleet Category',
                  prefixIcon: Icon(
                    Icons.category,
                    color: AppTheme.primaryYellow,
                  ),
                ),
                items: const [
                  DropdownMenuItem(
                    value: 'BIKE',
                    child: Text('Moto / Bike Taxi'),
                  ),
                  DropdownMenuItem(value: 'AUTO', child: Text('Auto Rickshaw')),
                  DropdownMenuItem(
                    value: 'MINI',
                    child: Text('Mini Hatchback'),
                  ),
                  DropdownMenuItem(
                    value: 'SEDAN',
                    child: Text('Premier Sedan'),
                  ),
                  DropdownMenuItem(
                    value: 'SUV',
                    child: Text('XL 6-Seater SUV'),
                  ),
                ],
                onChanged: (val) => setState(() => _category = val ?? 'AUTO'),
              ),
              const SizedBox(height: 14),

              TextField(
                controller: _vehicleNumberCtrl,
                style: const TextStyle(
                  color: Colors.white,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.bold,
                ),
                decoration: const InputDecoration(
                  labelText: 'Vehicle Plate Number (e.g. MP-09-RN-7711)',
                  prefixIcon: Icon(Icons.pin, color: AppTheme.primaryYellow),
                ),
              ),
              const SizedBox(height: 14),

              TextField(
                controller: _licenseCtrl,
                style: const TextStyle(
                  color: Colors.white,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.bold,
                ),
                decoration: const InputDecoration(
                  labelText: 'Driving Licence Number',
                  prefixIcon: Icon(Icons.badge, color: AppTheme.primaryYellow),
                ),
              ),
              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: authState.isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.secondaryAmber,
                ),
                child: authState.isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.black,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text('Submit Application & Vehicle Details'),
              ),
              const SizedBox(height: 20),

              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Already registered driver? ',
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                  ),
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: const Text(
                      'Sign In',
                      style: TextStyle(
                        color: AppTheme.primaryYellow,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
