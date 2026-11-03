import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/widgets/ridenow_logo.dart';
import '../providers/auth_provider.dart';

class RiderLoginScreen extends ConsumerStatefulWidget {
  const RiderLoginScreen({super.key});

  @override
  ConsumerState<RiderLoginScreen> createState() => _RiderLoginScreenState();
}

class _RiderLoginScreenState extends ConsumerState<RiderLoginScreen> {
  final _identifierCtrl = TextEditingController(text: '9893011223');
  final _passwordCtrl = TextEditingController(text: 'Rider@123');
  bool _obscure = true;

  Future<void> _submit() async {
    final success = await ref
        .read(authProvider.notifier)
        .riderLogin(_identifierCtrl.text.trim(), _passwordCtrl.text.trim());

    if (success && mounted) {
      context.go('/rider/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Rider Sign In'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/gateway'),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 10),
              const Center(
                child: RideNowLogo(height: 44, isDark: true),
              ),
              const SizedBox(height: 18),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primaryYellow.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Row(
                  children: const [
                    Icon(
                      Icons.person_pin_circle_rounded,
                      color: AppTheme.primaryYellow,
                    ),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Rider Portal • Bookings, OpenFreeMap & SafeComm',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
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
                controller: _identifierCtrl,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Mobile Number or Email',
                  prefixIcon: Icon(
                    Icons.phone_iphone,
                    color: AppTheme.primaryYellow,
                  ),
                ),
              ),
              const SizedBox(height: 16),

              TextField(
                controller: _passwordCtrl,
                obscureText: _obscure,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Password',
                  prefixIcon: const Icon(
                    Icons.lock_outline,
                    color: AppTheme.primaryYellow,
                  ),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscure ? Icons.visibility_off : Icons.visibility,
                      color: AppTheme.textMuted,
                    ),
                    onPressed: () => setState(() => _obscure = !_obscure),
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
                    : const Text('Sign In as Rider'),
              ),
              const SizedBox(height: 16),

              OutlinedButton(
                onPressed: () {
                  _identifierCtrl.text = '9893011223';
                  _passwordCtrl.text = 'Rider@123';
                  _submit();
                },
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.borderSubtle),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Text(
                  'One-Tap Demo Rider Login',
                  style: TextStyle(
                    color: AppTheme.primaryYellow,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(height: 24),

              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'New to RideNow? ',
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                  ),
                  GestureDetector(
                    onTap: () => context.push('/rider/signup'),
                    child: const Text(
                      'Create Rider Account',
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
