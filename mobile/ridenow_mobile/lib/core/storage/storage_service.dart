import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const String _keyRiderToken = 'ridenow_rider_token';
  static const String _keyDriverToken = 'ridenow_driver_token';
  static const String _keyActivePortal = 'ridenow_active_portal';
  static const String _keyUserData = 'ridenow_user_data';

  final SharedPreferences _prefs;

  StorageService(this._prefs);

  static Future<StorageService> init() async {
    final prefs = await SharedPreferences.getInstance();
    return StorageService(prefs);
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

