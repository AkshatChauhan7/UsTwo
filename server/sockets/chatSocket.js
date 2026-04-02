const Message = require('../models/Message');
const Couple = require('../models/Couple');
const CanvasState = require('../models/CanvasState');

module.exports = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log('🔌 User connected:', socket.id, 'User ID:', userId);

    const updateCouplePresence = async (coupleId) => {
      const roomName = `couple-${coupleId}`;
      const room = io.sockets.adapter.rooms.get(roomName);
      const activeUsersCount = room ? room.size : 0;

      await Couple.findByIdAndUpdate(coupleId, {
        isActive: activeUsersCount >= 2,
        lastActivityAt: new Date()
      });
    };

    // Join couple room
    socket.on('join-room', async (data) => {
      try {
        const { coupleId } = data;

        // Verify couple exists and user is part of it
        const couple = await Couple.findById(coupleId);
        if (!couple) {
          socket.emit('error', { msg: 'Couple not found' });
          return;
        }

        const isPartOfCouple = 
          couple.user1Id.toString() === userId || 
          couple.user2Id.toString() === userId;

        if (!isPartOfCouple) {
          socket.emit('error', { msg: 'Not part of this couple' });
          return;
        }

        // Join the room
        socket.join(`couple-${coupleId}`);
        console.log(`✅ User ${userId} joined room: couple-${coupleId}`);

        await updateCouplePresence(coupleId);

        // Notify partner that user is online
        socket.to(`couple-${coupleId}`).emit('partner-online', {
          userId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('🔥 Join room error:', error);
        socket.emit('error', { msg: 'Error joining room' });
      }
    });

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { coupleId, content, senderName, clientTempId } = data;
        const senderId = userId; // Get from authenticated socket

        // Create message in DB
        const message = new Message({
          coupleId,
          senderId,
          content,
          readBy: [senderId]
        });

        await message.save();

        // Broadcast to couple room
        io.to(`couple-${coupleId}`).emit('receive-message', {
          _id: message._id,
          coupleId,
          senderId,
          senderName,
          content,
          timestamp: message.timestamp,
          read: message.read,
          reactions: message.reactions,
          edited: message.edited,
          deleted: message.deleted,
          clientTempId
        });

        console.log(`💬 Message sent in couple-${coupleId} by ${userId}`);
      } catch (error) {
        console.error('🔥 Send message error:', error);
        socket.emit('error', { msg: 'Error sending message' });
      }
    });

    // Typing indicator
    socket.on('user-typing', (data) => {
      const { coupleId, senderName } = data;
      socket.to(`couple-${coupleId}`).emit('partner-typing', {
        userId,
        senderName
      });
    });

    // Stop typing
    socket.on('user-stop-typing', (data) => {
      const { coupleId } = data;
      socket.to(`couple-${coupleId}`).emit('partner-stop-typing', {
        userId
      });
    });

    // Read receipts
    socket.on('mark-read', async (data) => {
      try {
        const { coupleId } = data;
        await Message.updateMany(
          { coupleId, senderId: { $ne: userId }, read: false },
          {
            $set: { read: true, readAt: new Date() },
            $addToSet: { readBy: userId }
          }
        );

        io.to(`couple-${coupleId}`).emit('messages-read', {
          coupleId,
          readerId: userId,
          readAt: new Date()
        });
      } catch (error) {
        console.error('🔥 Mark read socket error:', error);
      }
    });

    socket.on('react-message', async (data) => {
      try {
        const { coupleId, messageId, emoji } = data;
        if (!emoji) return;

        const message = await Message.findById(messageId);
        if (!message) return;

        const existingReactionIndex = message.reactions.findIndex(
          (reaction) => reaction.userId.toString() === userId
        );

        if (existingReactionIndex !== -1) {
          if (message.reactions[existingReactionIndex].emoji === emoji) {
            message.reactions.splice(existingReactionIndex, 1);
          } else {
            message.reactions[existingReactionIndex].emoji = emoji;
          }
        } else {
          message.reactions.push({ userId, emoji });
        }

        await message.save();

        io.to(`couple-${coupleId}`).emit('message-reacted', {
          messageId,
          reactions: message.reactions
        });
      } catch (error) {
        console.error('🔥 React message socket error:', error);
      }
    });

    socket.on('edit-message', async (data) => {
      try {
        const { coupleId, messageId, content } = data;
        if (!content || !content.trim()) return;

        const message = await Message.findById(messageId);
        if (!message) return;
        if (message.senderId.toString() !== userId) return;
        if (message.deleted) return;

        message.content = content.trim();
        message.edited = true;
        message.editedAt = new Date();
        await message.save();

        io.to(`couple-${coupleId}`).emit('message-edited', {
          messageId,
          content: message.content,
          edited: message.edited,
          editedAt: message.editedAt
        });
      } catch (error) {
        console.error('🔥 Edit message socket error:', error);
      }
    });

    socket.on('delete-message', async (data) => {
      try {
        const { coupleId, messageId } = data;

        const message = await Message.findById(messageId);
        if (!message) return;
        if (message.senderId.toString() !== userId) return;

        message.deleted = true;
        message.deletedAt = new Date();
        message.content = 'This message was deleted';
        await message.save();

        io.to(`couple-${coupleId}`).emit('message-deleted', {
          messageId,
          deleted: true,
          deletedAt: message.deletedAt,
          content: message.content
        });
      } catch (error) {
        console.error('🔥 Delete message socket error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log('❌ User disconnected:', socket.id, 'User ID:', userId);

      try {
        const joinedRooms = Array.from(socket.rooms).filter((room) => room.startsWith('couple-'));
        for (const room of joinedRooms) {
          const coupleId = room.replace('couple-', '');
          await updateCouplePresence(coupleId);
          socket.to(room).emit('partner-offline', {
            userId,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('🔥 Disconnect presence error:', error);
      }
    });

    // Leave room
    socket.on('leave-room', async (data) => {
      const { coupleId } = data;
      socket.leave(`couple-${coupleId}`);
      console.log(`❌ User ${userId} left room: couple-${coupleId}`);
      await updateCouplePresence(coupleId);
      socket.to(`couple-${coupleId}`).emit('partner-offline', {
        userId,
        timestamp: new Date()
      });
    });

    // Canvas - Draw stroke
    socket.on('draw-stroke', async (data) => {
      try {
        const { coupleId, points, color, size } = data;

        // Get or create canvas state
        let canvas = await CanvasState.findOne({ coupleId });
        if (!canvas) {
          canvas = new CanvasState({ coupleId, strokes: [] });
        }

        // Add stroke to canvas
        canvas.strokes.push({
          points,
          color,
          size,
          userId,
          createdAt: new Date()
        });

        canvas.lastModifiedBy = userId;
        await canvas.save();

        // Broadcast to couple room
        io.to(`couple-${coupleId}`).emit('receive-stroke', {
          points,
          color,
          size,
          userId,
          timestamp: new Date()
        });

        console.log(`🎨 Stroke drawn in couple-${coupleId} by ${userId}`);
      } catch (error) {
        console.error('🔥 Draw stroke error:', error);
        socket.emit('error', { msg: 'Error drawing stroke' });
      }
    });

    // Canvas - Clear canvas
    socket.on('clear-canvas', async (data) => {
      try {
        const { coupleId } = data;

        // Clear canvas in DB
        let canvas = await CanvasState.findOne({ coupleId });
        if (canvas) {
          canvas.strokes = [];
          canvas.isCleared = true;
          canvas.lastModifiedBy = userId;
          await canvas.save();
        }

        // Broadcast to couple room
        io.to(`couple-${coupleId}`).emit('canvas-cleared', {
          userId,
          timestamp: new Date()
        });

        console.log(`🗑️  Canvas cleared in couple-${coupleId} by ${userId}`);
      } catch (error) {
        console.error('🔥 Clear canvas error:', error);
        socket.emit('error', { msg: 'Error clearing canvas' });
      }
    });

    // Canvas - Get initial canvas state
    socket.on('request-canvas-state', async (data) => {
      try {
        const { coupleId } = data;

        const canvas = await CanvasState.findOne({ coupleId }).populate('strokes.userId', 'name');
        if (canvas && canvas.strokes.length > 0) {
          socket.emit('canvas-state', {
            strokes: canvas.strokes,
            timestamp: new Date()
          });
          console.log(`📋 Canvas state sent for couple-${coupleId}`);
        }
      } catch (error) {
        console.error('🔥 Get canvas state error:', error);
        socket.emit('error', { msg: 'Error getting canvas state' });
      }
    });
  });
};
