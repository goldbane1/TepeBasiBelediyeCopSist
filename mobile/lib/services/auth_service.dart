import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api_client.dart';
import '../models/user_session.dart';

class AuthService {
  final ApiClient _api = ApiClient();

  Future<UserSession?> login(String username, String password) async {
    try {
      final response = await _api.post('/auth/login', data: {
        'username': username,
        'password': password,
      });

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        final userJson = data['user'] ?? data;
        final user = UserSession.fromJson(userJson);

        final token = data['token'] ?? data['sessionId'] ?? '';
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', token);
        await prefs.setString('user_data', jsonEncode(user.toJson()));

        return user;
      }
      return null;
    } catch (e) {
      print("[Auth Error] Login failed: $e");
      rethrow;
    }
  }

  Future<UserSession?> getSavedSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userDataStr = prefs.getString('user_data');
      if (userDataStr != null) {
        return UserSession.fromJson(jsonDecode(userDataStr));
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_data');
    try {
      await _api.post('/auth/logout');
    } catch (_) {}
  }
}
