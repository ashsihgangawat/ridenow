class ChatMessageModel {
  final String id;
  final String rideId;
  final String senderId;
  final String receiverId;
  final String senderRole;
  final String senderName;
  final String message;
  final String messageType;
  final bool isRead;
  final String? readAt;
  final String status;
  final DateTime createdAt;

  ChatMessageModel({
    required this.id,
    required this.rideId,
    required this.senderId,
    required this.receiverId,
    required this.senderRole,
    required this.senderName,
    required this.message,
    this.messageType = 'TEXT',
    this.isRead = false,
    this.readAt,
    this.status = 'SENT',
    required this.createdAt,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      id: json['id'] ?? '',
      rideId: json['rideId'] ?? '',
      senderId: json['senderId'] ?? '',
      receiverId: json['receiverId'] ?? '',
      senderRole: json['senderRole'] ?? 'RIDER',
      senderName: json['senderName'] ?? '',
      message: json['message'] ?? '',
      messageType: json['messageType'] ?? 'TEXT',
      isRead: json['isRead'] == true,
      readAt: json['readAt'],
      status: json['status'] ?? 'SENT',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'rideId': rideId,
      'senderId': senderId,
      'receiverId': receiverId,
      'senderRole': senderRole,
      'senderName': senderName,
      'message': message,
      'messageType': messageType,
      'isRead': isRead,
      'readAt': readAt,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

