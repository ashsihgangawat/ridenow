import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ridenow_mobile/app/theme/app_theme.dart';
import 'package:ridenow_mobile/core/widgets/ridenow_logo.dart';
import 'package:ridenow_mobile/features/auth/screens/portal_gateway_screen.dart';
import 'package:ridenow_mobile/features/splash/screens/splash_screen.dart';

void main() {
  testWidgets(
    'Splash Screen displays RideNow logo and branding',
    (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: const SplashScreen(),
          ),
        ),
      );

      expect(find.byType(RideNowLogo), findsOneWidget);
      expect(find.text('Indian Urban Mobility'), findsOneWidget);
      expect(find.text('Fast • Safe • Reliable'), findsOneWidget);
    },
  );

  testWidgets(
    'Portal Gateway renders RideNow brand and portal selector cards',
    (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            theme: AppTheme.darkTheme,
            home: const PortalGatewayScreen(),
          ),
        ),
      );

      // Verify Brand Logo
      expect(find.byType(RideNowLogo), findsOneWidget);
      expect(
        find.text('Indian Urban Mobility • Choose Your Portal'),
        findsOneWidget,
      );

      // Verify 2 Portal Cards
      expect(find.text('Rider Portal'), findsOneWidget);
      expect(find.text('Driver Partner Portal'), findsOneWidget);
      expect(find.text('PASSENGER'), findsOneWidget);
      expect(find.text('PILOT / DRIVER'), findsOneWidget);
      expect(find.text('Enter Rider App'), findsOneWidget);
      expect(find.text('Enter Partner Dashboard'), findsOneWidget);
    },
  );
}
