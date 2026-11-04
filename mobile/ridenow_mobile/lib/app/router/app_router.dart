import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/splash/screens/splash_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/portal_gateway_screen.dart';
import '../../features/auth/screens/rider_login_screen.dart';
import '../../features/auth/screens/rider_signup_screen.dart';
import '../../features/auth/screens/driver_login_screen.dart';
import '../../features/rider/screens/rider_main_shell_screen.dart';
import '../../features/rider/screens/rider_active_ride_screen.dart';
import '../../features/rider/screens/rider_history_screen.dart';
import '../../features/rider/screens/rider_profile_screen.dart';
import '../../features/driver/screens/driver_dashboard_screen.dart';
import '../../features/driver/screens/driver_profile_screen.dart';
import '../../features/driver/screens/driver_registration_screen.dart';
import '../../features/driver/screens/driver_verification_status_screen.dart';
import '../../features/driver/screens/admin_verification_screen.dart';
import '../../features/payment/screens/payment_screen.dart';

class RouterNotifier extends ChangeNotifier {
  final Ref _ref;

  RouterNotifier(this._ref) {
    _ref.listen<AuthState>(
      authProvider,
      (previous, next) {
        if (previous?.isAuthenticated != next.isAuthenticated ||
            previous?.user?.role != next.user?.role) {
          notifyListeners();
        }
      },
    );
  }
}

final routerNotifierProvider = Provider<RouterNotifier>((ref) {
  return RouterNotifier(ref);
});

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ref.watch(routerNotifierProvider);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final loc = state.matchedLocation;
      final isAuth = authState.isAuthenticated;
      final role = authState.user?.role;

      // 1. Rider Protected Routes
      if (loc.startsWith('/rider/home') ||
          loc.startsWith('/rider/ride') ||
          loc.startsWith('/rider/history') ||
          loc.startsWith('/rider/profile') ||
          loc.startsWith('/rider/payment')) {
        if (!isAuth) return '/rider/login';
        if (role == 'DRIVER') return '/driver/dashboard';
      }

      // 2. Driver Protected Routes
      if (loc.startsWith('/driver/dashboard') ||
          loc.startsWith('/driver/kyc') ||
          loc.startsWith('/driver/profile') ||
          loc.startsWith('/driver/verification')) {
        if (!isAuth) return '/driver/login';
        if (role == 'RIDER' || role == 'CUSTOMER') return '/rider/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/gateway',
        builder: (context, state) => const PortalGatewayScreen(),
      ),

      // --- RIDER ROUTES ---
      GoRoute(
        path: '/rider/login',
        builder: (context, state) => const RiderLoginScreen(),
      ),
      GoRoute(
        path: '/rider/signup',
        builder: (context, state) => const RiderSignupScreen(),
      ),
      GoRoute(
        path: '/rider/home',
        builder: (context, state) => const RiderMainShellScreen(),
      ),
      GoRoute(
        path: '/rider/ride/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return RiderActiveRideScreen(rideId: id);
        },
      ),
      GoRoute(
        path: '/rider/payment/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return PaymentScreen(rideId: id);
        },
      ),
      GoRoute(
        path: '/rider/history',
        builder: (context, state) => const RiderHistoryScreen(),
      ),
      GoRoute(
        path: '/rider/profile',
        builder: (context, state) => const RiderProfileScreen(),
      ),

      // --- DRIVER ROUTES ---
      GoRoute(
        path: '/driver/login',
        builder: (context, state) => const DriverLoginScreen(),
      ),
      GoRoute(
        path: '/driver/signup',
        builder: (context, state) => const DriverRegistrationScreen(),
      ),
      GoRoute(
        path: '/driver/register',
        builder: (context, state) => const DriverRegistrationScreen(),
      ),
      GoRoute(
        path: '/driver/dashboard',
        builder: (context, state) => const DriverDashboardScreen(),
      ),
      GoRoute(
        path: '/driver/kyc',
        builder: (context, state) => const DriverVerificationStatusScreen(),
      ),
      GoRoute(
        path: '/driver/verification',
        builder: (context, state) => const DriverVerificationStatusScreen(),
      ),
      GoRoute(
        path: '/driver/profile',
        builder: (context, state) => const DriverProfileScreen(),
      ),
      GoRoute(
        path: '/admin/verifications',
        builder: (context, state) => const AdminVerificationScreen(),
      ),
    ],
  );
});
