import 'package:flutter/material.dart';
import '../models/user_session.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  UserSession? _user;
  bool _isLoading = true;
  String? _errorMessage;

  UserSession? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  String? get errorMessage => _errorMessage;

  AuthProvider() {
    checkSavedSession();
  }

  Future<void> checkSavedSession() async {
    _isLoading = true;
    notifyListeners();
    try {
      _user = await _authService.getSavedSession();
    } catch (_) {
      _user = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final user = await _authService.login(username, password);
      _user = user;
      _isLoading = false;
      notifyListeners();
      return user != null;
    } catch (e) {
      _errorMessage = "Giriş başarısız. Lütfen bilgilerinizi ve sunucu bağlantısını kontrol edin.";
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    notifyListeners();
  }
}
