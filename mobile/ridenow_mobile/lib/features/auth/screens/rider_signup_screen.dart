import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/widgets/ridenow_logo.dart';
import '../providers/auth_provider.dart';

class RiderSignupScreen extends ConsumerStatefulWidget {
  const RiderSignupScreen({super.key});

  @override
  ConsumerState<RiderSignupScreen> createState() => _RiderSignupScreenState();
}

class _RiderSignupScreenState extends ConsumerState<RiderSignupScreen> {
  final _nameCtrl = TextEditingController(text: 'Ananya Patel');
  final _phoneCtrl = TextEditingController(text: '+919811223344');
  final _emailCtrl = TextEditingController(text: 'ananya@example.in');
  final _passwordCtrl = TextEditingController(text: 'Password@123');

  Future<void> _submit() async {
    final success = await ref
        .read(authProvider.notifier)
        .riderSignup(
          fullName: _nameCtrl.text.trim(),
          phone: _phoneCtrl.text.trim(),
          email: _emailCtrl.text.trim(),
          password: _passwordCtrl.text.trim(),
        );

    if (success && mounted) {
      context.go('/rider/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Rider Registration')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Center(
                child: RideNowLogo(height: 44, isDark: true),
              ),
              const SizedBox(height: 18),
              const Text(
                'Join RideNow as Passenger',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Instant booking across Indore with live telemetry and SOS emergency protection.',
                style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
              ),
              const SizedBox(height: 24),

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
                  labelText: 'Full Name',
                  prefixIcon: Icon(
                    Icons.person_outline,
                    color: AppTheme.primaryYellow,
                  ),
                ),
              ),
              const SizedBox(height: 16),

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
              const SizedBox(height: 16),

              TextField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Email Address (Optional)',
                  prefixIcon: Icon(
                    Icons.email_outlined,
                    color: AppTheme.primaryYellow,
                  ),
                ),
              ),
              const SizedBox(height: 16),

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
              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: authState.isLoading ? null : _submit,
                child: authState.isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.black,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text('Complete Rider Registration'),
              ),
              const SizedBox(height: 20),

              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Already have a Rider account? ',
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
