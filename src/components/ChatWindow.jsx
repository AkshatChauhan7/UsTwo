import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api from '../api';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import InputBar from './InputBar';

const ChatWindow = ({ coupleId, partnerName }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await api.getChatHistory(coupleId, 50, 0);
        const { messages: chatMessages } = response.data;
        setMessages(chatMessages.reverse());
        setIsLoadingHistory(false);
      } catch (error) {
        console.error('Failed to load chat history:', error);
        setIsLoadingHistory(false);
      }
    };

    if (coupleId) {
      loadHistory();
    }
  }, [coupleId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !coupleId) return;

    // Join the couple room
    socket.emit('join-room', {
      coupleId,
      userId: user?.id,
    });

    // Listen for incoming messages
    const handleReceiveMessage = (data) => {
      setMessages((prev) => [...prev, data]);
      // Mark message as read
      api.markRead(coupleId).catch(console.error);
    };

    // Listen for partner typing
    const handlePartnerTyping = () => {
      setIsTyping(true);
    };

    // Listen for partner stop typing
    const handlePartnerStopTyping = () => {
      setIsTyping(false);
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('partner-typing', handlePartnerTyping);
    socket.on('partner-stop-typing', handlePartnerStopTyping);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('partner-typing', handlePartnerTyping);
      socket.off('partner-stop-typing', handlePartnerStopTyping);
      socket.emit('leave-room', { coupleId });
    };
  }, [socket, coupleId, user?.id]);

  const handleSendMessage = (content) => {
    if (!content.trim()) return;

    // Optimistically add message to UI
    const optimisticMessage = {
      _id: Date.now(),
      content,
      senderId: { _id: user?.id, name: user?.name, initials: user?.initials },
      timestamp: new Date().toISOString(),
      read: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Send via Socket.io
    if (socket) {
      socket.emit('send-message', {
        coupleId,
        userId: user?.id,
        content,
      });
    }

    // Also save to DB as backup
    api.sendMessage(coupleId, user?.id, content).catch(console.error);
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('user-typing', { coupleId, userId: user?.id });
    }
  };

  const handleStopTyping = () => {
    if (socket) {
      socket.emit('user-stop-typing', { coupleId, userId: user?.id });
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-pink-200 bg-white shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800">{partnerName}</h2>
        <p className="text-sm text-gray-500">💕 Your special connection</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <span className="text-4xl mb-4">💕</span>
            <p>Start your conversation with {partnerName}!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={message.senderId?._id === user?.id}
              />
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <TypingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <InputBar
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        placeholder={`Message ${partnerName}...`}
      />
    </div>
  );
};

export default ChatWindow;
