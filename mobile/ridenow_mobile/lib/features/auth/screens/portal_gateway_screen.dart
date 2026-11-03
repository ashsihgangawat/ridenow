import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/widgets/ridenow_logo.dart';
import '../providers/auth_provider.dart';

class PortalGatewayScreen extends ConsumerWidget {
  const PortalGatewayScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              // Brand Logo & Title
              const Center(
                child: RideNowLogo(
                  height: 48,
                  isDark: true,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Indian Urban Mobility • Choose Your Portal',
                style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 32),

              // PORTAL 1: RIDER CARD
              _buildPortalCard(
                context: context,
                title: 'Rider Portal',
                subtitle:
                    'Book city rides, OpenFreeMap tracking, 4-digit safety PIN & instant fares.',
                badge: 'PASSENGER',
                icon: Icons.person_pin_circle_rounded,
                isPrimary: true,
                onTap: () {
                  ref.read(authProvider.notifier).switchPortal('RIDER');
                  context.push('/rider/login');
                },
              ),

              const SizedBox(height: 20),

              // PORTAL 2: DRIVER PARTNER CARD
              _buildPortalCard(
                context: context,
                title: 'Driver Partner Portal',
                subtitle:
                    'Accept incoming trips, live GPS dispatch, KYC compliance & daily earnings.',
                badge: 'PILOT / DRIVER',
                icon: Icons.local_taxi_rounded,
                isPrimary: false,
                onTap: () {
                  ref.read(authProvider.notifier).switchPortal('DRIVER');
                  context.push('/driver/login');
                },
              ),

              const SizedBox(height: 36),

              // Bottom Compliance Info
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(
                    Icons.shield_outlined,
                    color: AppTheme.primaryYellow,
                    size: 16,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'MVA 2019 Compliant • SafeComm Real-Time Chat',
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
                  ),
                ],
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPortalCard({
    required BuildContext context,
    required String title,
    required String subtitle,
    required String badge,
    required IconData icon,
    required bool isPrimary,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surfaceDark,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isPrimary ? AppTheme.primaryYellow : AppTheme.borderSubtle,
          width: isPrimary ? 1.5 : 1.0,
        ),
        boxShadow: [
          if (isPrimary)
            BoxShadow(
              color: AppTheme.primaryYellow.withOpacity(0.12),
              blurRadius: 20,
              spreadRadius: 2,
            ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(24),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(24),
          splashColor: AppTheme.primaryYellow.withOpacity(0.15),
          highlightColor: AppTheme.primaryYellow.withOpacity(0.08),
          child: Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color:
                            isPrimary ? AppTheme.primaryYellow : Colors.white10,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Icon(
                        icon,
                        color:
                            isPrimary ? Colors.black : AppTheme.primaryYellow,
                        size: 24,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryYellow.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.borderSubtle),
                      ),
                      child: Text(
                        badge,
                        style: const TextStyle(
                          color: AppTheme.primaryYellow,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  subtitle,
                  style:
                      const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Text(
                      isPrimary ? 'Enter Rider App' : 'Enter Partner Dashboard',
                      style: TextStyle(
                        color:
                            isPrimary ? AppTheme.primaryYellow : Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward_rounded,
                      color: isPrimary ? AppTheme.primaryYellow : Colors.white,
                      size: 16,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
