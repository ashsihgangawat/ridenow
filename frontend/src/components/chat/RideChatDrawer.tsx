import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import {
  X,
  Send,
  Phone,
  Check,
  CheckCheck,
  MessageSquare,
  Sparkles,
  Shield,
  Clock,
  Car,
  AlertCircle
} from 'lucide-react';

export interface ChatMessageItem {
  id: string;
  rideId: string;
  senderId: string;
  receiverId: string;
  senderRole: 'RIDER' | 'DRIVER' | 'ADMIN';
  senderName: string;
  message: string;
  messageType: 'TEXT' | 'QUICK_PICKUP' | 'SYSTEM';
  isRead: boolean;
  readAt: string | null;
  status?: 'SENT' | 'DELIVERED' | 'READ';
  createdAt: string;
}

interface RideChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: string;
  currentUserId: string;
  userRole: 'RIDER' | 'DRIVER' | 'ADMIN';
  counterpartName: string;
  counterpartPhone?: string;
  counterpartAvatar?: string;
  vehicleInfo?: string;
  rideStatus: string;
  token: string | null;
  onMessagesRead?: () => void;
}

const RIDER_QUICK_MESSAGES = [
  'I am waiting at the pickup location.',
  'I am near the main gate.',
  'Please call me when you arrive.',
  'I am sharing my exact location.',
  'I will be there in 2 minutes.',
  'Please wait for me.'
];

const DRIVER_QUICK_MESSAGES = [
  'I am on my way.',
  'I have reached your pickup location.',
  'Please come to the pickup point.',
  'I am waiting near the main gate.',
  'Please share your exact location.',
  'I am unable to find your location.'
];

export const RideChatDrawer: React.FC<RideChatDrawerProps> = ({
  isOpen,
  onClose,
  rideId,
  currentUserId,
  userRole,
  counterpartName,
  counterpartPhone,
  counterpartAvatar,
  vehicleInfo,
  rideStatus,
  token,
  onMessagesRead
}) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showQuickChips, setShowQuickChips] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isReadOnly = ['COMPLETED', 'CANCELLED'].includes(rideStatus);
  const quickMessages = userRole === 'RIDER' ? RIDER_QUICK_MESSAGES : DRIVER_QUICK_MESSAGES;

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // 1. Fetch Chat History
  const fetchMessages = async () => {
    if (!rideId || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/${rideId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
        if (onMessagesRead) onMessagesRead();
      }
    } catch (err) {
      console.warn('Failed to load chat history:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Mark messages as read
  const markAsRead = async () => {
    if (!rideId || !token) return;
    try {
      await fetch(`/api/chat/${rideId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onMessagesRead) onMessagesRead();
    } catch (e) {
      // ignore
    }
  };

  // Initial load & socket room join
  useEffect(() => {
    if (isOpen && rideId) {
      fetchMessages();
      markAsRead();
      if (socket) {
        socket.emit('join_chat', { rideId });
      }
      setTimeout(() => {
        scrollToBottom(false);
        inputRef.current?.focus();
      }, 150);
    }

    return () => {
      if (socket && rideId) {
        socket.emit('leave_chat', { rideId });
      }
    };
  }, [isOpen, rideId, socket]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Real-time Socket.IO events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: ChatMessageItem) => {
      if (msg.rideId === rideId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        // If the message is received while chat drawer is open, mark it as read immediately
        if (isOpen && msg.receiverId === currentUserId) {
          markAsRead();
        }
      }
    };

    const handleMessagesRead = (data: { rideId: string; readerId: string; readAt: string }) => {
      if (data.rideId === rideId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.receiverId === data.readerId) {
              return { ...m, isRead: true, readAt: data.readAt, status: 'READ' };
            }
            return m;
          })
        );
      }
    };

    socket.on('new_chat_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('new_chat_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, rideId, isOpen, currentUserId]);

  // Send message handler
  const handleSendMessage = async (text: string, type: 'TEXT' | 'QUICK_PICKUP' = 'TEXT') => {
    const trimmed = text.trim();
    if (!trimmed || isSending || isReadOnly || !token) return;

    setIsSending(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/chat/${rideId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: trimmed, messageType: type })
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setInputText('');
      } else {
        setErrorMsg(data.message || 'Failed to send message');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while sending message');
    } finally {
      setIsSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText, 'TEXT');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0e0e13] border-l border-yellow-500/30 flex flex-col h-full shadow-[0_0_50px_rgba(0,0,0,0.9)] animate-in slide-in-from-right duration-300">
        
        {/* ======================================================== */}
        {/* HEADER                                                   */}
        {/* ======================================================== */}
        <div className="p-4 bg-[#141418] border-b border-yellow-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 text-black flex items-center justify-center text-lg font-black shadow-neon-yellow-sm">
                {counterpartAvatar || counterpartName?.[0] || (userRole === 'RIDER' ? 'D' : 'P')}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#141418] rounded-full shadow-neon-cyan animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">{counterpartName}</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-400">
                  {userRole === 'RIDER' ? 'Driver Partner' : 'Passenger'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                {vehicleInfo ? (
                  <>
                    <Car className="w-3 h-3 text-yellow-400" />
                    <span>{vehicleInfo}</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Online & Ready for live chat</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {counterpartPhone && (
              <a
                href={`tel:${counterpartPhone}`}
                className="p-2.5 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 rounded-xl transition border border-yellow-400/30 shadow-neon-yellow-sm flex items-center gap-1 text-xs font-bold"
                title={`Call ${counterpartName} at ${counterpartPhone}`}
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Call</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-xl transition border border-white/10"
              title="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Safety & Encryption Banner */}
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 flex items-center justify-between text-[11px] text-yellow-400 font-medium">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 shrink-0 text-yellow-400" />
            <span>RideNow SafeComm • Direct Driver-Rider Link</span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">Ride #{rideId.slice(0, 8)}</span>
        </div>

        {/* Read-only Alert when ride is completed or cancelled */}
        {isReadOnly && (
          <div className="bg-amber-950/70 border-b border-amber-600/40 p-3 flex items-center gap-2 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Ride is {rideStatus.toLowerCase()}. Chat history is preserved in read-only mode.
            </span>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHAT MESSAGES BODY                                       */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 cyber-circuit-bg">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-yellow-400"></div>
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mx-auto text-yellow-400 shadow-neon-yellow-sm">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-white">Start Conversation</h4>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Coordinate pickup point, landmarks, or special arrival instructions in real time.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderId === currentUserId || (userRole === 'RIDER' && msg.senderRole === 'RIDER') || (userRole === 'DRIVER' && msg.senderRole === 'DRIVER');
            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl p-3.5 shadow-md relative text-xs font-medium leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black rounded-tr-none shadow-neon-yellow-sm border border-yellow-300'
                      : 'bg-[#181820] text-neutral-100 rounded-tl-none border border-white/10'
                  }`}
                >
                  {/* Quick pickup badge */}
                  {msg.messageType === 'QUICK_PICKUP' && (
                    <div
                      className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5 ${
                        isMe
                          ? 'bg-black/20 text-neutral-900 border border-black/10'
                          : 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/30'
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Pickup Situation</span>
                    </div>
                  )}

                  <p className="break-words select-text">{msg.message}</p>

                  <div
                    className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 font-mono ${
                      isMe ? 'text-neutral-800' : 'text-neutral-400'
                    }`}
                  >
                    <span>{timeStr}</span>
                    {isMe && (
                      <span title={msg.isRead ? 'Read' : 'Delivered'}>
                        {msg.isRead ? (
                          <CheckCheck className="w-3.5 h-3.5 text-neutral-950 font-bold" />
                        ) : (
                          <Check className="w-3 h-3 text-neutral-700" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* ======================================================== */}
        {/* PREDEFINED QUICK PICKUP CHIPS                            */}
        {/* ======================================================== */}
        {!isReadOnly && showQuickChips && (
          <div className="bg-[#121216] border-t border-white/10 p-2.5">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                Quick {userRole === 'RIDER' ? 'Rider' : 'Driver'} Updates
              </span>
              <button
                type="button"
                onClick={() => setShowQuickChips(false)}
                className="text-[10px] text-neutral-500 hover:text-neutral-300"
              >
                Hide
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {quickMessages.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isSending}
                  onClick={() => handleSendMessage(chip, 'QUICK_PICKUP')}
                  className="whitespace-nowrap px-3 py-1.5 bg-[#1c1c24] hover:bg-yellow-400/20 text-neutral-300 hover:text-yellow-400 rounded-xl text-[11px] font-semibold border border-white/10 hover:border-yellow-400/40 transition shrink-0 active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Toggle quick chips if hidden */}
        {!isReadOnly && !showQuickChips && (
          <div className="bg-[#121216] border-t border-white/10 px-3 py-1 text-right">
            <button
              type="button"
              onClick={() => setShowQuickChips(true)}
              className="text-[10px] text-yellow-400 font-bold hover:underline"
            >
              + Show Quick Messages
            </button>
          </div>
        )}

        {/* Error message banner */}
        {errorMsg && (
          <div className="bg-red-950/80 border-t border-red-600/50 p-2 px-4 text-xs text-red-300 font-semibold">
            {errorMsg}
          </div>
        )}

        {/* ======================================================== */}
        {/* INPUT FOOTER                                             */}
        {/* ======================================================== */}
        <div className="p-3 bg-[#141418] border-t border-yellow-500/20">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isReadOnly || isSending}
              placeholder={
                isReadOnly
                  ? 'Ride completed. Chat is read-only.'
                  : `Message ${counterpartName}...`
              }
              maxLength={500}
              className="flex-1 bg-black/60 border border-white/15 focus:border-yellow-400 rounded-2xl px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending || isReadOnly}
              className="p-3 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-black rounded-2xl shadow-neon-yellow-sm border border-yellow-400/50 transition active:scale-95"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

