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
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 15),
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
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
            options.headers['Cookie'] = 'auth_token=$token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          print("[API Error] ${e.requestOptions.path}: ${e.message}");
          return handler.next(e);
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

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data}) {
    return _dio.post(path, data: data);
  }

  Future<Response> put(String path, {dynamic data}) {
    return _dio.put(path, data: data);
  }

  Future<Response> delete(String path) {
    return _dio.delete(path);
  }

  // tRPC Batch Query / Mutation Çağrıcı Yardımcısı
  Future<dynamic> trpcQuery(String procedure, {Map<String, dynamic>? input}) async {
    final path = "/trpc/$procedure";
    final queryParams = input != null ? {'input': jsonEncode(input)} : null;
    final response = await _dio.get(path, queryParameters: queryParams);
    return response.data?['result']?['data'];
  }

  Future<dynamic> trpcMutate(String procedure, dynamic input) async {
    final path = "/trpc/$procedure";
    final response = await _dio.post(path, data: input);
    return response.data?['result']?['data'];
  }

}
