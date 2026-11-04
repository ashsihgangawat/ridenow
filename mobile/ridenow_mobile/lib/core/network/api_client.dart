import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../storage/storage_service.dart';
import '../../app/config/environment.dart';

class ApiClient {
  late final Dio dio;
  final StorageService storage;

  ApiClient(this.storage) {
    dio = Dio(
      BaseOptions(
        baseUrl: EnvironmentConfig.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Request/Response Interceptor for Auth, Path Normalization & Logging
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // Normalize endpoint paths for deployed FastAPI backend
          // (FastAPI backend routes are mounted at /driver/ and /admin/)
          if (options.path.startsWith('/api/driver/')) {
            options.path = options.path.replaceFirst('/api/driver/', '/driver/');
          } else if (options.path.startsWith('/api/admin/')) {
            options.path = options.path.replaceFirst('/api/admin/', '/admin/');
          }

          // Detect portal from path or active storage portal
          final activePortal = storage.getActivePortal();
          String? token;
          if (options.path.contains('/driver') || activePortal == 'DRIVER') {
            token = storage.getDriverToken();
            if (token != null) {
              options.headers['x-driver-token'] = token;
            }
          } else {
            token = storage.getRiderToken();
            if (token != null) {
              options.headers['x-rider-token'] = token;
            }
          }

          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          if (kDebugMode) {
            debugPrint('[API Request] ${options.method} ${options.uri}');
          }

          return handler.next(options);
        },
        onResponse: (response, handler) {
          // Harmonize FastAPI {"detail": "..."} to {"message": "..."}
          if (response.data is Map<String, dynamic>) {
            final map = response.data as Map<String, dynamic>;
            if (map['detail'] != null && map['message'] == null) {
              map['message'] = map['detail'].toString();
            }
          }
          return handler.next(response);
        },
        onError: (DioException error, handler) {
          // Harmonize FastAPI error {"detail": "..."} to {"message": "..."}
          if (error.response?.data is Map<String, dynamic>) {
            final map = error.response!.data as Map<String, dynamic>;
            if (map['detail'] != null && map['message'] == null) {
              map['message'] = map['detail'].toString();
            }
          }
          if (kDebugMode) {
            debugPrint(
              '[API Error] ${error.requestOptions.method} ${error.requestOptions.uri} -> ${error.response?.statusCode}: ${error.message}',
            );
          }
          return handler.next(error);
        },
      ),
    );
  }

  // REST Helpers
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }
}
