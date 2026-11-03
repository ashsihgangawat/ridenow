import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/chat_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../app/theme/app_theme.dart';

class ChatSheet extends ConsumerStatefulWidget {
  final String rideId;
  final String counterpartRole; // 'DRIVER' or 'RIDER'

  const ChatSheet({
    super.key,
    required this.rideId,
    required this.counterpartRole,
  });

  static void show(
    BuildContext context,
    String rideId,
    String counterpartRole,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) =>
          ChatSheet(rideId: rideId, counterpartRole: counterpartRole),
    );
  }

  @override
  ConsumerState<ChatSheet> createState() => _ChatSheetState();
}

class _ChatSheetState extends ConsumerState<ChatSheet> {
  final TextEditingController _textCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();

  static const List<String> riderQuickMessages = [
    'I am waiting at the pickup location.',
    'I am near the main gate.',
    'Please call me when you arrive.',
    'I am sharing my exact location.',
    'I will be there in 2 minutes.',
    'Please wait for me.',
  ];

  static const List<String> driverQuickMessages = [
    'I am on my way.',
    'I have reached your pickup location.',
    'Please come to the pickup point.',
    'I am waiting near the main gate.',
    'Please share your exact location.',
    'I am unable to find your location.',
  ];

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(chatProvider.notifier).bindRide(widget.rideId);
    });
  }

  void _scrollToBottom() {
    if (_scrollCtrl.hasClients) {
      _scrollCtrl.animateTo(
        _scrollCtrl.position.maxScrollExtent + 80,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _callCounterpart(String? phone) async {
    if (phone == null || phone.isEmpty) return;
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProvider);
    final authState = ref.watch(authProvider);
    final myUserId = authState.user?.id ?? '';
    final contact = chatState.counterpartContact;

    final quickChips = widget.counterpartRole == 'DRIVER'
        ? riderQuickMessages
        : driverQuickMessages;

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: AppTheme.surfaceDark,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(
          top: BorderSide(color: AppTheme.primaryYellow, width: 1.5),
        ),
      ),
      child: Column(
        children: [
          // Drag Handle
          const SizedBox(height: 10),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(4),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppTheme.primaryYellow,
                  foregroundColor: Colors.black,
                  radius: 20,
                  child: Text(
                    (contact?['name'] ?? widget.counterpartRole)[0]
                        .toUpperCase(),
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        contact?['name'] ??
                            (widget.counterpartRole == 'DRIVER'
                                ? 'Driver Partner'
                                : 'Passenger'),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        contact?['vehicle'] != null
                            ? '${contact!['vehicle']['make']} ${contact['vehicle']['model']} (${contact['vehicle']['registrationNumber']})'
                            : 'RideNow SafeComm Active',
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 11,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                if (contact?['phone'] != null)
                  IconButton(
                    onPressed: () => _callCounterpart(contact?['phone']),
                    style: IconButton.styleFrom(
                      backgroundColor: AppTheme.primaryYellow.withOpacity(0.15),
                      foregroundColor: AppTheme.primaryYellow,
                    ),
                    icon: const Icon(Icons.phone),
                    tooltip: 'Call Direct',
                  ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: Colors.white70),
                ),
              ],
            ),
          ),
          const Divider(color: AppTheme.borderSubtle, height: 1),

          // Read-Only Warning if completed/cancelled
          if (chatState.isReadOnly)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
              color: Colors.amber.withOpacity(0.15),
              child: const Text(
                '🔒 Ride is finished. Chat history is preserved in read-only mode.',
                style: TextStyle(
                  color: Colors.amber,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),

          // Messages List
          Expanded(
            child: chatState.isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: AppTheme.primaryYellow,
                    ),
                  )
                : chatState.messages.isEmpty
                ? const Center(
                    child: Text(
                      'No messages yet. Send a quick pickup note below!',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.all(16),
                    itemCount: chatState.messages.length,
                    itemBuilder: (context, index) {
                      final msg = chatState.messages[index];
                      final isMe =
                          msg.senderId == myUserId ||
                          (widget.counterpartRole == 'DRIVER' &&
                              msg.senderRole == 'RIDER') ||
                          (widget.counterpartRole == 'RIDER' &&
                              msg.senderRole == 'DRIVER');

                      return Align(
                        alignment: isMe
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          constraints: BoxConstraints(
                            maxWidth: MediaQuery.of(context).size.width * 0.78,
                          ),
                          decoration: BoxDecoration(
                            color: isMe
                                ? AppTheme.primaryYellow
                                : AppTheme.cardDark,
                            borderRadius: BorderRadius.circular(16).copyWith(
                              bottomRight: isMe
                                  ? const Radius.circular(0)
                                  : const Radius.circular(16),
                              bottomLeft: !isMe
                                  ? const Radius.circular(0)
                                  : const Radius.circular(16),
                            ),
                            border: Border.all(
                              color: isMe
                                  ? Colors.transparent
                                  : AppTheme.borderLight,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (msg.messageType == 'QUICK_PICKUP')
                                Container(
                                  margin: const EdgeInsets.only(bottom: 4),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isMe
                                        ? Colors.black26
                                        : AppTheme.primaryYellow.withOpacity(
                                            0.2,
                                          ),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    '📍 Pickup Note',
                                    style: TextStyle(
                                      color: isMe
                                          ? Colors.black87
                                          : AppTheme.primaryYellow,
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              Text(
                                msg.message,
                                style: TextStyle(
                                  color: isMe ? Colors.black : Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  Text(
                                    '${msg.createdAt.hour.toString().padLeft(2, '0')}:${msg.createdAt.minute.toString().padLeft(2, '0')}',
                                    style: TextStyle(
                                      color: isMe
                                          ? Colors.black54
                                          : AppTheme.textMuted,
                                      fontSize: 10,
                                    ),
                                  ),
                                  if (isMe) ...[
                                    const SizedBox(width: 4),
                                    Icon(
                                      msg.isRead ? Icons.done_all : Icons.done,
                                      size: 13,
                                      color: msg.isRead
                                          ? Colors.black87
                                          : Colors.black45,
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Predefined Quick Pickup Chips
          if (!chatState.isReadOnly)
            Container(
              height: 42,
              margin: const EdgeInsets.only(bottom: 8),
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: quickChips.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, idx) {
                  final text = quickChips[idx];
                  return ActionChip(
                    backgroundColor: AppTheme.cardDark,
                    side: const BorderSide(color: AppTheme.borderSubtle),
                    label: Text(
                      text,
                      style: const TextStyle(color: Colors.white, fontSize: 11),
                    ),
                    onPressed: () {
                      ref
                          .read(chatProvider.notifier)
                          .sendMessage(text, type: 'QUICK_PICKUP');
                      _scrollToBottom();
                    },
                  );
                },
              ),
            ),

          // Input Bar
          if (!chatState.isReadOnly)
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _textCtrl,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                        ),
                        decoration: InputDecoration(
                          hintText: 'Type a message...',
                          hintStyle: const TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 12,
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                          filled: true,
                          fillColor: AppTheme.cardDark,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: const BorderSide(
                              color: AppTheme.borderSubtle,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: () {
                        final txt = _textCtrl.text.trim();
                        if (txt.isNotEmpty) {
                          ref.read(chatProvider.notifier).sendMessage(txt);
                          _textCtrl.clear();
                          _scrollToBottom();
                        }
                      },
                      style: IconButton.styleFrom(
                        backgroundColor: AppTheme.primaryYellow,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.all(12),
                      ),
                      icon: const Icon(Icons.send_rounded, size: 20),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
