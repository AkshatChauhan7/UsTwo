import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api from '../api';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import InputBar from './InputBar';

const toMessageId = (value) => (value ? String(value) : '');

const ChatWindow = ({
  coupleId,
  partnerName,
  mood = 'cozy',
  onOpenCanvas,
  onToggleMenu,
  isMobileMenuOpen = false
}) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isMediaUploading, setIsMediaUploading] = useState(false);
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await api.getChatHistory(coupleId, 50, 0);
        const { messages: chatMessages } = response.data;
        setMessages(chatMessages);
        setIsLoadingHistory(false);
      } catch (error) {
        console.error('Failed to load chat history:', error);
        setIsLoadingHistory(false);
      }
    };

    if (coupleId) {
      shouldAutoScrollRef.current = true;
      loadHistory();
    }
  }, [coupleId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'auto'
    });
  }, [messages]);

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 72;
  };

  const commitIncomingMessage = React.useCallback((data) => {
    setMessages((prev) => {
      const next = [...prev];
      const dbId = toMessageId(data?._id);
      const tempId = toMessageId(data?.clientTempId);

      if (tempId) {
        const optimisticIndex = next.findIndex((msg) => toMessageId(msg._id) === tempId);
        if (optimisticIndex !== -1) {
          next[optimisticIndex] = {
            ...next[optimisticIndex],
            ...data,
            _id: data._id,
            deliveryStatus: 'sent',
            deliveryError: null
          };

          if (dbId) {
            return next.filter((msg, idx) => idx === optimisticIndex || toMessageId(msg._id) !== dbId);
          }

          return next;
        }
      }

      if (dbId) {
        const existingIndex = next.findIndex((msg) => toMessageId(msg._id) === dbId);
        if (existingIndex !== -1) {
          next[existingIndex] = {
            ...next[existingIndex],
            ...data,
            deliveryStatus: 'sent',
            deliveryError: null
          };
          return next;
        }
      }

      return [...next, { ...data, deliveryStatus: 'sent', deliveryError: null }];
    });
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !coupleId) return;

    const joinRoom = () => {
      socket.emit('join-room', {
        coupleId,
      });
    };

    // Join room now (or queued), and re-join on reconnect
    joinRoom();
    socket.on('connect', joinRoom);

    // Listen for incoming messages
    const handleReceiveMessage = (data) => {
      commitIncomingMessage(data);
      // Mark message as read
      api.markRead(coupleId).catch(console.error);
      socket.emit('mark-read', { coupleId });
    };

    // Listen for partner typing
    const handlePartnerTyping = () => {
      setIsTyping(true);
    };

    // Listen for partner stop typing
    const handlePartnerStopTyping = () => {
      setIsTyping(false);
    };

    const handlePartnerOnline = () => {
      setIsPartnerOnline(true);
    };

    const handlePartnerOffline = () => {
      setIsPartnerOnline(false);
      setIsTyping(false);
    };

    const handleMessagesRead = ({ readerId }) => {
      if (readerId === user?.id) return;
      setMessages((prev) =>
        prev.map((msg) => {
          const sender = msg.senderId?._id || msg.senderId;
          if (sender === user?.id) {
            return { ...msg, read: true, readAt: new Date().toISOString() };
          }
          return msg;
        })
      );
    };

    const handleMessageReacted = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id?.toString() === messageId?.toString() ? { ...msg, reactions } : msg))
      );
    };

    const handleMessageEdited = ({ messageId, content, edited, editedAt }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id?.toString() === messageId?.toString()
            ? { ...msg, content, edited, editedAt }
            : msg
        )
      );
    };

    const handleMessageDeleted = ({ messageId, deleted, deletedAt, content }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id?.toString() === messageId?.toString()
            ? { ...msg, deleted, deletedAt, content }
            : msg
        )
      );
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('partner-typing', handlePartnerTyping);
    socket.on('partner-stop-typing', handlePartnerStopTyping);
    socket.on('partner-online', handlePartnerOnline);
    socket.on('partner-offline', handlePartnerOffline);
    socket.on('messages-read', handleMessagesRead);
    socket.on('message-reacted', handleMessageReacted);
    socket.on('message-edited', handleMessageEdited);
    socket.on('message-deleted', handleMessageDeleted);

    // mark current history as read when room opens
    api.markRead(coupleId).catch(console.error);
    socket.emit('mark-read', { coupleId });

    return () => {
      socket.off('connect', joinRoom);
      socket.off('receive-message', handleReceiveMessage);
      socket.off('partner-typing', handlePartnerTyping);
      socket.off('partner-stop-typing', handlePartnerStopTyping);
      socket.off('partner-online', handlePartnerOnline);
      socket.off('partner-offline', handlePartnerOffline);
      socket.off('messages-read', handleMessagesRead);
      socket.off('message-reacted', handleMessageReacted);
      socket.off('message-edited', handleMessageEdited);
      socket.off('message-deleted', handleMessageDeleted);
      socket.emit('leave-room', { coupleId });
    };
  }, [socket, coupleId, user?.id, commitIncomingMessage]);

  const handleSendMessage = async (content, options = {}) => {
    if (!content.trim()) return;

    shouldAutoScrollRef.current = true;
    const clientTempId = options.clientTempId || `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: clientTempId,
      content,
      type: 'text',
      messageType: 'text',
      fileUrl: null,
      mediaUrl: null,
      senderId: { _id: user?.id, name: user?.name, initials: user?.initials },
      timestamp: new Date().toISOString(),
      read: true,
      reactions: [],
      edited: false,
      deleted: false,
      deliveryStatus: 'sending',
      deliveryError: null
    };

    setMessages((prev) => {
      const existingIndex = prev.findIndex((msg) => toMessageId(msg._id) === toMessageId(clientTempId));
      if (existingIndex !== -1) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          ...optimisticMessage
        };
        return copy;
      }
      return [...prev, optimisticMessage];
    });

    try {
      // API-first send path for reliability; backend emits realtime receive-message
      const res = await api.sendMessage(coupleId, content, clientTempId);
      const saved = res.data.message;
      commitIncomingMessage({ ...saved, clientTempId });
    } catch (error) {
      markMessageFailed(clientTempId, error?.message || 'Failed to send');
      throw error;
    }

    return clientTempId;
  };

  const markMessageFailed = React.useCallback((clientTempId, reason) => {
    setMessages((prev) =>
      prev.map((msg) =>
        toMessageId(msg._id) === toMessageId(clientTempId)
          ? { ...msg, deliveryStatus: 'failed', deliveryError: reason || 'Failed to send' }
          : msg
      )
    );
  }, []);

  const retryFailedMessage = async (message) => {
    const retryId = toMessageId(message?._id);
    if (!message?.content || !retryId) return;

    setMessages((prev) =>
      prev.map((msg) =>
        toMessageId(msg._id) === retryId
          ? { ...msg, deliveryStatus: 'sending', deliveryError: null }
          : msg
      )
    );

    try {
      await handleSendMessage(message.content, { clientTempId: retryId });
    } catch (error) {
      markMessageFailed(retryId, error?.message || 'Retry failed');
    }
  };

  const handleSendMedia = async (file, mediaType) => {
    if (!coupleId || !file) return;
    setIsMediaUploading(true);
    try {
      await api.sendMediaMessage(coupleId, file, mediaType);
      shouldAutoScrollRef.current = true;
    } catch (error) {
      console.error('Failed to upload media message:', error);
      const reason = error?.response?.data?.error || error?.response?.data?.msg || 'Upload failed';
      window.alert(reason);
    } finally {
      setIsMediaUploading(false);
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('user-typing', { coupleId, userId: user?.id, senderName: user?.name });
    }
  };

  const handleStopTyping = () => {
    if (socket) {
      socket.emit('user-stop-typing', { coupleId, userId: user?.id });
    }
  };

  const handleReactMessage = (messageId, emoji) => {
    if (socket?.connected) {
      socket.emit('react-message', { coupleId, messageId, emoji });
    } else {
      api.reactToMessage(messageId, emoji)
        .then((res) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id?.toString() === messageId?.toString()
                ? { ...msg, reactions: res.data.reactions }
                : msg
            )
          );
        })
        .catch(console.error);
    }
  };

  const handleEditMessage = (messageId, content) => {
    if (socket?.connected) {
      socket.emit('edit-message', { coupleId, messageId, content });
    } else {
      api.editMessage(messageId, content)
        .then((res) => {
          const { message } = res.data;
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id?.toString() === messageId?.toString()
                ? { ...msg, ...message }
                : msg
            )
          );
        })
        .catch(console.error);
    }
  };

  const handleDeleteMessage = (messageId) => {
    if (socket?.connected) {
      socket.emit('delete-message', { coupleId, messageId });
    } else {
      api.deleteMessage(messageId)
        .then((res) => {
          const { message } = res.data;
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id?.toString() === messageId?.toString()
                ? { ...msg, ...message }
                : msg
            )
          );
        })
        .catch(console.error);
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-full rounded-2xl ustwo-glass">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col h-full min-h-0 rounded-none sm:rounded-2xl border overflow-hidden ustwo-soft-shadow ${
        mood === 'night'
          ? 'bg-[#1f172a] border-[#3a2d4c]'
          : 'bg-rose-50 border-pink-100'
      }`}
    >
      {/* Chat Header */}
      <div className={`px-2.5 sm:px-5 py-3 sm:py-4 border-b ${mood === 'night' ? 'border-[#3a2d4c] bg-white/5' : 'border-pink-200 bg-white/70'} backdrop-blur-xl`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex items-start gap-2">
            <button
              type="button"
              onClick={onToggleMenu}
              className="md:hidden min-w-[44px] min-h-[44px] rounded-full border border-pink-100 bg-white/80 text-gray-600 flex items-center justify-center"
              aria-label={isMobileMenuOpen ? 'Back' : 'Menu'}
            >
              {isMobileMenuOpen ? (
                <svg className="w-5 h-5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              ) : (
                <svg className="w-5 h-5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              )}
            </button>
            <div className="min-w-0">
              <h2 className={`text-lg sm:text-xl font-semibold truncate ${mood === 'night' ? 'text-white' : 'text-gray-800'}`}>{partnerName}</h2>
              <p className={`text-xs ${mood === 'night' ? 'text-gray-300' : 'text-gray-500'}`}>This space belongs only to us</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={onOpenCanvas}
              className={`text-xs px-2.5 sm:px-3 py-1.5 rounded-full border font-semibold ${
                mood === 'night'
                  ? 'border-white/20 text-white bg-white/10 hover:bg-white/20'
                  : 'border-pink-200 text-pink-700 bg-white/80 hover:bg-pink-50'
              }`}
            >
              Open Canvas
            </button>
            <span className={`ustwo-pill ${mood === 'night' ? '!bg-white/15 !text-white !border-white/20' : ''}`}>
              {mood === 'night' ? 'Late Night' : 'Cozy Mood'}
            </span>
          </div>
        </div>
        <p className={`text-xs mt-2 ${isPartnerOnline ? 'text-green-500' : mood === 'night' ? 'text-gray-400' : 'text-gray-400'}`}>
          {isPartnerOnline ? '● Partner online' : '○ Partner offline'}
        </p>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-2 sm:px-4 md:px-5 py-3 sm:py-4 pb-28 md:pb-4"
      >
        {messages.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full text-center px-4 ${mood === 'night' ? 'text-gray-300' : 'text-gray-500'}`}>
            <span className="text-3xl sm:text-4xl mb-3 animate-float-soft">💕</span>
            <p className="text-sm sm:text-base">Start your conversation with {partnerName}!</p>
          </div>
        ) : (
          <>
            <div className="max-w-4xl mx-auto w-full space-y-3">
              {messages.map((message) => (
                <div key={message._id}>
                  <MessageBubble
                    message={message}
                    isOwn={(message.senderId?._id || message.senderId) === user?.id}
                    onReact={handleReactMessage}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                    canEdit={(message.senderId?._id || message.senderId) === user?.id}
                    showRead={(message.senderId?._id || message.senderId) === user?.id}
                  />
                  {(message.senderId?._id || message.senderId) === user?.id && message.deliveryStatus === 'failed' ? (
                    <div className="flex justify-end mt-1">
                      <button
                        type="button"
                        onClick={() => retryFailedMessage(message)}
                        className="text-[11px] px-2 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200"
                      >
                        Failed • Retry
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <TypingIndicator />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Input Area */}
      <InputBar
        onSendMessage={handleSendMessage}
        onSendMedia={handleSendMedia}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        mediaUploading={isMediaUploading}
        placeholder={`Message ${partnerName}...`}
      />
    </div>
  );
};

export default ChatWindow;
