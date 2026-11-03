import 'package:flutter_test/flutter_test.dart';
import 'package:ridenow_mobile/features/chat/models/chat_message_model.dart';

void main() {
  group('ChatMessageModel Unit Tests', () {
    test(
      'Chat message correctly identifies quick pickup tag and read receipts',
      () {
        final json = {
          'id': 'msg-1',
          'rideId': 'ride-8899',
          'senderId': 'user-1',
          'receiverId': 'driver-1',
          'senderRole': 'RIDER',
          'senderName': 'Aarav Sharma',
          'message': 'I am waiting near the main gate.',
          'messageType': 'QUICK_PICKUP',
          'isRead': true,
          'readAt': '2026-11-02T10:05:00.000Z',
          'status': 'READ',
          'createdAt': '2026-11-02T10:04:00.000Z',
        };

        final msg = ChatMessageModel.fromJson(json);
        expect(msg.id, 'msg-1');
        expect(msg.messageType, 'QUICK_PICKUP');
        expect(msg.isRead, isTrue);
        expect(msg.status, 'READ');
        expect(msg.message, 'I am waiting near the main gate.');
      },
    );
  });
}
