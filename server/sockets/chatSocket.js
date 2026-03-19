const Message = require('../models/Message');
const Couple = require('../models/Couple');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Join couple room
    socket.on('join-room', async (data) => {
      try {
        const { coupleId, userId } = data;

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
        const { coupleId, senderId, content, senderName } = data;

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

        console.log(`💬 Message sent in couple-${coupleId}`);
      } catch (error) {
        console.error('🔥 Send message error:', error);
        socket.emit('error', { msg: 'Error sending message' });
      }
    });

    // Typing indicator
    socket.on('user-typing', (data) => {
      const { coupleId, userId, senderName } = data;
      socket.to(`couple-${coupleId}`).emit('partner-typing', {
        userId,
        senderName
      });
    });

    // Stop typing
    socket.on('user-stop-typing', (data) => {
      const { coupleId, userId } = data;
      socket.to(`couple-${coupleId}`).emit('partner-stop-typing', {
        userId
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });

    // Leave room
    socket.on('leave-room', (data) => {
      const { coupleId } = data;
      socket.leave(`couple-${coupleId}`);
      console.log(`❌ User left room: couple-${coupleId}`);
    });
  });
};
