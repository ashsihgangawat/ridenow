import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/chat_message_model.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/socket_service.dart';
import '../../auth/providers/auth_provider.dart';

class ChatState {
  final bool isLoading;
  final String? activeRideId;
  final List<ChatMessageModel> messages;
  final Map<String, dynamic>? counterpartContact;
  final int unreadCount;
  final bool isReadOnly;
  final String? error;

  ChatState({
    this.isLoading = false,
    this.activeRideId,
    this.messages = const [],
    this.counterpartContact,
    this.unreadCount = 0,
    this.isReadOnly = false,
    this.error,
  });

  ChatState copyWith({
    bool? isLoading,
    String? activeRideId,
    List<ChatMessageModel>? messages,
    Map<String, dynamic>? counterpartContact,
    int? unreadCount,
    bool? isReadOnly,
    String? error,
  }) {
    return ChatState(
      isLoading: isLoading ?? this.isLoading,
      activeRideId: activeRideId ?? this.activeRideId,
      messages: messages ?? this.messages,
      counterpartContact: counterpartContact ?? this.counterpartContact,
      unreadCount: unreadCount ?? this.unreadCount,
      isReadOnly: isReadOnly ?? this.isReadOnly,
      error: error,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  final ApiClient _api;
  final SocketService _socket;

  ChatNotifier(this._api, this._socket) : super(ChatState()) {
    _initSocketListeners();
  }

  void _initSocketListeners() {
    _socket.on('new_chat_message', (data) {
      if (data is Map<String, dynamic>) {
        final newMsg = ChatMessageModel.fromJson(data);
        if (state.activeRideId == newMsg.rideId) {
          final exists = state.messages.any((m) => m.id == newMsg.id);
          if (!exists) {
            state = state.copyWith(
              messages: [...state.messages, newMsg],
              unreadCount: state.unreadCount + 1,
            );
          }
        }
      }
    });

    _socket.on('messages_read', (data) {
      if (data is Map<String, dynamic> &&
          data['rideId'] == state.activeRideId) {
        final readerId = data['readerId'];
        final readAt = data['readAt'];
        state = state.copyWith(
          messages: state.messages.map((m) {
            if (m.receiverId == readerId) {
              return ChatMessageModel(
                id: m.id,
                rideId: m.rideId,
                senderId: m.senderId,
                receiverId: m.receiverId,
                senderRole: m.senderRole,
                senderName: m.senderName,
                message: m.message,
                messageType: m.messageType,
                isRead: true,
                readAt: readAt,
                status: 'READ',
                createdAt: m.createdAt,
              );
            }
            return m;
          }).toList(),
        );
      }
    });
  }

  Future<void> bindRide(String rideId) async {
    state = state.copyWith(activeRideId: rideId, isLoading: true);
    _socket.joinChat(rideId);
    await loadMessages(rideId);
    await fetchContact(rideId);
  }

  Future<void> loadMessages(String rideId) async {
    try {
      final res = await _api.get(ApiEndpoints.chatMessages(rideId));
      if (res.data['success'] == true) {
        final list = (res.data['messages'] as List)
            .map((m) => ChatMessageModel.fromJson(m))
            .toList();
        state = state.copyWith(
          isLoading: false,
          messages: list,
          isReadOnly: res.data['isReadOnly'] == true,
          unreadCount: 0,
        );
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> fetchContact(String rideId) async {
    try {
      final res = await _api.get(ApiEndpoints.contactDetails(rideId));
      if (res.data['success'] == true) {
        state = state.copyWith(counterpartContact: res.data['contact']);
      }
    } catch (_) {}
  }

  Future<bool> sendMessage(String text, {String type = 'TEXT'}) async {
    final rideId = state.activeRideId;
    if (rideId == null || text.trim().isEmpty || state.isReadOnly) return false;

    try {
      final res = await _api.post(
        ApiEndpoints.chatMessages(rideId),
        data: {'message': text.trim(), 'messageType': type},
      );

      if (res.data['success'] == true && res.data['message'] != null) {
        final msg = ChatMessageModel.fromJson(res.data['message']);
        final exists = state.messages.any((m) => m.id == msg.id);
        if (!exists) {
          state = state.copyWith(messages: [...state.messages, msg]);
        }
        return true;
      }
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
    return false;
  }

  Future<void> markRead() async {
    final rideId = state.activeRideId;
    if (rideId == null) return;
    try {
      await _api.post(ApiEndpoints.markChatRead(rideId));
      state = state.copyWith(unreadCount: 0);
    } catch (_) {}
  }
}

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  final api = ref.watch(apiClientProvider);
  final socket = ref.watch(socketServiceProvider);
  return ChatNotifier(api, socket);
});
