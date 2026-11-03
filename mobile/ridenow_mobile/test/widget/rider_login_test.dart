import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ridenow_mobile/app/theme/app_theme.dart';
import 'package:ridenow_mobile/core/storage/storage_service.dart';
import 'package:ridenow_mobile/features/auth/providers/auth_provider.dart';
import 'package:ridenow_mobile/features/auth/screens/rider_login_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets(
    'Rider Login Screen renders mobile input, password, and sign-in buttons',
    (WidgetTester tester) async {
      SharedPreferences.setMockInitialValues({});
      final storage = await StorageService.init();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [storageServiceProvider.overrideWithValue(storage)],
          child: MaterialApp(
            theme: AppTheme.darkTheme,
            home: const RiderLoginScreen(),
          ),
        ),
      );

      expect(find.text('Rider Sign In'), findsOneWidget);
      expect(find.text('Mobile Number or Email'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.text('Sign In as Rider'), findsOneWidget);
      expect(find.text('One-Tap Demo Rider Login'), findsOneWidget);
      expect(find.text('Create Rider Account'), findsOneWidget);
    },
  );
}
