const Message = require('../models/Message');
const Couple = require('../models/Couple');
const CanvasState = require('../models/CanvasState');

module.exports = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log('🔌 User connected:', socket.id, 'User ID:', userId);

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
        const { coupleId, content, senderName } = data;
        const senderId = userId; // Get from authenticated socket

        // Create message in DB
        const message = new Message({
          coupleId,
          senderId,
          content
        });

        await message.save();

        // Broadcast to couple room
        io.to(`couple-${coupleId}`).emit('receive-message', {
          _id: message._id,
          coupleId,
          senderId,
          senderName,
          content,
          timestamp: message.timestamp
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

    // Disconnect
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id, 'User ID:', userId);
    });

    // Leave room
    socket.on('leave-room', (data) => {
      const { coupleId } = data;
      socket.leave(`couple-${coupleId}`);
      console.log(`❌ User ${userId} left room: couple-${coupleId}`);
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
