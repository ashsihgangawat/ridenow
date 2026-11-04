import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const String _keyRiderToken = 'ridenow_rider_token';
  static const String _keyDriverToken = 'ridenow_driver_token';
  static const String _keyActivePortal = 'ridenow_active_portal';
  static const String _keyUserData = 'ridenow_user_data';
  static const String _keyThemeMode = 'ridenow_theme_mode';
  static const String _keyNotificationPrefs = 'ridenow_notification_prefs';
  static const String _keyFavouriteLocations = 'ridenow_favourite_locations';
  static const String _keySupportTickets = 'ridenow_support_tickets';

  final SharedPreferences _prefs;

  StorageService(this._prefs);

  static Future<StorageService> init() async {
    final prefs = await SharedPreferences.getInstance();
    return StorageService(prefs);
  }

  // Theme Management
  Future<void> saveThemeMode(String mode) async =>
      await _prefs.setString(_keyThemeMode, mode);

  String getThemeMode() => _prefs.getString(_keyThemeMode) ?? 'SYSTEM';

  // Notification Preferences
  Future<void> saveNotificationPreferences(Map<String, dynamic> prefs) async =>
      await _prefs.setString(_keyNotificationPrefs, jsonEncode(prefs));

  Map<String, dynamic>? getNotificationPreferences() {
    final raw = _prefs.getString(_keyNotificationPrefs);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  // Favourite Locations
  Future<void> saveFavouriteLocations(List<Map<String, dynamic>> locations) async =>
      await _prefs.setString(_keyFavouriteLocations, jsonEncode(locations));

  List<Map<String, dynamic>> getFavouriteLocations() {
    final raw = _prefs.getString(_keyFavouriteLocations);
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  // Support Tickets Cache
  Future<void> saveSupportTickets(List<Map<String, dynamic>> tickets) async =>
      await _prefs.setString(_keySupportTickets, jsonEncode(tickets));

  List<Map<String, dynamic>> getSupportTickets() {
    final raw = _prefs.getString(_keySupportTickets);
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  // Token Management
  Future<void> saveRiderToken(String token) async =>
      await _prefs.setString(_keyRiderToken, token);

  String? getRiderToken() => _prefs.getString(_keyRiderToken);

  Future<void> saveDriverToken(String token) async =>
      await _prefs.setString(_keyDriverToken, token);

  String? getDriverToken() => _prefs.getString(_keyDriverToken);

  // Portal Management
  Future<void> setActivePortal(String portal) async =>
      await _prefs.setString(_keyActivePortal, portal);

  String getActivePortal() => _prefs.getString(_keyActivePortal) ?? 'GATEWAY';

  // User Profile Cache
  Future<void> saveUser(Map<String, dynamic> userMap) async =>
      await _prefs.setString(_keyUserData, jsonEncode(userMap));

  Map<String, dynamic>? getUser() {
    final raw = _prefs.getString(_keyUserData);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  // Logout / Clear
  Future<void> clearRiderSession() async {
    await _prefs.remove(_keyRiderToken);
  }

  Future<void> clearDriverSession() async {
    await _prefs.remove(_keyDriverToken);
  }

  Future<void> clearAll() async {
    await _prefs.clear();
  }
}

