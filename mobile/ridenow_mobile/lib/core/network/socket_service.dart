import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../app/config/environment.dart';

class SocketService {
  io.Socket? _socket;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  void connect({String? userId, String? role, String? driverId}) {
    if (_socket != null && _isConnected) return;

    try {
      _socket = io.io(
        EnvironmentConfig.socketUrl,
        io.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionDelay(1000)
            .setReconnectionAttempts(10)
            .build(),
      );

      _socket!.onConnect((_) {
        _isConnected = true;
        debugPrint('[Socket.IO] Connected to ${EnvironmentConfig.socketUrl}');
        if (userId != null) {
          _socket!.emit('join_user', {
            'userId': userId,
            'role': role ?? 'RIDER',
            'driverId': driverId,
          });
        }
      });

      _socket!.onDisconnect((_) {
        _isConnected = false;
        debugPrint('[Socket.IO] Disconnected');
      });

      _socket!.onError((err) {
        debugPrint('[Socket.IO] Error: $err');
      });
    } catch (e) {
      debugPrint('[Socket.IO] Connection exception: $e');
    }
  }

  void joinRide(String rideId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('join_ride', {'rideId': rideId});
    }
  }

  void joinChat(String rideId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('join_chat', {'rideId': rideId});
    }
  }

  void leaveChat(String rideId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('leave_chat', {'rideId': rideId});
    }
  }

  void updateDriverLocation({
    required String driverId,
    required double lat,
    required double lng,
    double heading = 0.0,
    String? rideId,
  }) {
    if (_socket != null && _isConnected) {
      _socket!.emit('update_driver_location', {
        'driverId': driverId,
        'lat': lat,
        'lng': lng,
        'heading': heading,
        'rideId': rideId,
      });
    }
  }

  void emit(String event, [dynamic data]) {
    if (data != null) {
      _socket?.emit(event, data);
    } else {
      _socket?.emit(event);
    }
  }

  void on(String event, Function(dynamic) handler) {
    _socket?.on(event, handler);
  }

  void off(String event, [Function(dynamic)? handler]) {
    if (handler != null) {
      _socket?.off(event, handler);
    } else {
      _socket?.off(event);
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
  }
}

