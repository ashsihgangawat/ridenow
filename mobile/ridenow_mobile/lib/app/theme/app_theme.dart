import 'package:flutter/material.dart';

class AppTheme {
  // Brand Colors - Cyber Black & Yellow Palette
  static const Color primaryYellow = Color(0xFFFACC15);
  static const Color secondaryAmber = Color(0xFFF59E0B);
  static const Color backgroundBlack = Color(0xFF070709);
  static const Color surfaceDark = Color(0xFF0E0E13);
  static const Color cardDark = Color(0xFF141418);
  static const Color borderSubtle = Color(0x33FACC15);
  static const Color borderLight = Color(0x1FFFFFFF);
  static const Color textWhite = Color(0xFFFFFFFF);
  static const Color textMuted = Color(0xFF9CA3AF);
  static const Color successGreen = Color(0xFF10B981);
  static const Color errorRed = Color(0xFFEF4444);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: backgroundBlack,
      colorScheme: const ColorScheme.dark(
        primary: primaryYellow,
        onPrimary: Colors.black,
        secondary: secondaryAmber,
        onSecondary: Colors.black,
        surface: surfaceDark,
        onSurface: textWhite,
        error: errorRed,
        onError: Colors.white,
      ),
      fontFamily: 'Roboto',
      appBarTheme: const AppBarTheme(
        backgroundColor: surfaceDark,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: textWhite,
          fontSize: 18,
          fontWeight: FontWeight.w900,
          letterSpacing: -0.3,
        ),
        iconTheme: IconThemeData(color: primaryYellow),
      ),
      cardTheme: CardThemeData(
        color: cardDark,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: borderSubtle, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryYellow,
          foregroundColor: Colors.black,
          elevation: 2,
          padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 20),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            letterSpacing: 0.3,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.black.withOpacity(0.6),
        contentPadding: const EdgeInsets.symmetric(
          vertical: 16,
          horizontal: 18,
        ),
        hintStyle: const TextStyle(color: textMuted, fontSize: 13),
        labelStyle: const TextStyle(color: textMuted, fontSize: 13),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: primaryYellow, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: errorRed),
        ),
      ),
    );
  }
}
