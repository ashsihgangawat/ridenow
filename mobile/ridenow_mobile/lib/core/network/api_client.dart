import 'package:dio/dio.dart';
import '../storage/storage_service.dart';
import '../../app/config/environment.dart';

class ApiClient {
  late final Dio dio;
  final StorageService storage;

  ApiClient(this.storage) {
    dio = Dio(
      BaseOptions(
        baseUrl: EnvironmentConfig.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Request/Response Interceptor for Auth & Logging
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
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

          return handler.next(options);
        },
        onError: (DioException error, handler) {
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

