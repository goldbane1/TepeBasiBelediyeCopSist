import 'package:flutter/material.dart';

class AppTheme {
  // Tepebaşı Belediyesi Kurumsal Renkleri
  static const Color primaryGreen = Color(0xFF047857); // emerald-700
  static const Color primaryGreenDark = Color(0xFF064E3B); // emerald-900
  static const Color primaryGreenLight = Color(0xFF10B981); // emerald-500
  
  static const Color accentAmber = Color(0xFFD97706); // amber-600 (Damperlik Atık)
  static const Color accentRed = Color(0xFFDC2626); // red-600 (Arıza & Şikayet)
  static const Color accentBlue = Color(0xFF0284C7); // sky-600 (Çöp Kamyonu)

  static const Color bgLight = Color(0xFFF8FAFC); // slate-50
  static const Color bgCard = Colors.white;
  static const Color textMain = Color(0xFF0F172A); // slate-900
  static const Color textMuted = Color(0xFF64748B); // slate-500
  static const Color borderSubtle = Color(0xFFE2E8F0); // slate-200

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryGreen,
        primary: primaryGreen,
        secondary: accentAmber,
        background: bgLight,
        surface: bgCard,
      ),
      scaffoldBackgroundColor: bgLight,
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryGreenDark,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Colors.white,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardTheme(
        color: bgCard,
        elevation: 1,
        shadowColor: Colors.black.withOpacity(0.06),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: borderSubtle, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryGreen,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            letterSpacing: -0.2,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderSubtle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryGreen, width: 2),
        ),
        hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
      ),
    );
  }
}
