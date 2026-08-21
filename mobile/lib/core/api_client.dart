import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'constants.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late Dio _dio;
  String _baseUrl = AppConstants.defaultBaseUrl;

  String get baseUrl => _baseUrl;

  ApiClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: _baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 20),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('auth_token');
          if (token != null && token.isNotEmpty) {
            options.headers['Cookie'] = 'app_session_id=$token; auth_token=$token';
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },

        onResponse: (response, handler) async {
          // Gelen Set-Cookie başlığından auth_token'ı yakala ve kaydet
          final setCookieHeaders = response.headers['set-cookie'];
          if (setCookieHeaders != null) {
            for (final cookie in setCookieHeaders) {
              if (cookie.contains('auth_token=')) {
                final match = RegExp(r'auth_token=([^;]+)').firstMatch(cookie);
                if (match != null) {
                  final token = match.group(1);
                  if (token != null) {
                    final prefs = await SharedPreferences.getInstance();
                    await prefs.setString('auth_token', token);
                  }
                }
              }
            }
          }
          return handler.next(response);
        },
      ),
    );

    _loadSavedBaseUrl();
  }

  Future<void> _loadSavedBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final customUrl = prefs.getString('custom_api_url');
    if (customUrl != null && customUrl.isNotEmpty) {
      setBaseUrl(customUrl);
    }
  }

  void setBaseUrl(String newUrl) {
    _baseUrl = newUrl;
    _dio.options.baseUrl = newUrl;
  }

  // tRPC Query (SuperJSON uyumlu GET)
  Future<dynamic> trpcQuery(String procedure, {Map<String, dynamic>? input}) async {
    final path = "/trpc/$procedure";
    final queryParams = {'input': jsonEncode({'json': input ?? {}})};
    final response = await _dio.get(path, queryParameters: queryParams);
    final data = response.data?['result']?['data'];
    if (data is Map && data.containsKey('json')) {
      return data['json'];
    }
    return data;
  }

  // tRPC Mutation (SuperJSON uyumlu POST)
  Future<dynamic> trpcMutate(String procedure, dynamic input) async {
    final path = "/trpc/$procedure";
    final payload = {'json': input ?? {}};
    final response = await _dio.post(path, data: payload);
    final data = response.data?['result']?['data'];
    if (data is Map && data.containsKey('json')) {
      return data['json'];
    }
    return data;
  }
}
