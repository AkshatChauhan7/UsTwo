const router = require('express').Router();
const Message = require('../models/Message');
const Couple = require('../models/Couple');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * GET /api/chat/history/:coupleId
 * Get message history for a couple (paginated)
 * Auth: Required
 * Query: limit=50, skip=0
 */
router.get('/history/:coupleId', authMiddleware, async (req, res) => {
  try {
    const { coupleId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    console.log('📜 Fetching chat history for couple:', coupleId);

    // Verify couple exists and user is part of it
    const couple = await Couple.findById(coupleId);
    if (!couple) {
      return res.status(404).json({
        msg: 'Couple not found',
        code: 'COUPLE_NOT_FOUND'
      });
    }

    // Verify user is part of this couple
    const isPartOfCouple =
      couple.user1Id.toString() === req.user.id ||
      couple.user2Id.toString() === req.user.id;

    if (!isPartOfCouple) {
      return res.status(403).json({
        msg: 'You are not authorized to access this chat',
        code: 'UNAUTHORIZED'
      });
    }

    // Get messages (paginated, newest first)
    const messages = await Message.find({ coupleId })
      .populate('senderId', 'name initials email profileColor _id')
      .sort({ timestamp: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    const totalMessages = await Message.countDocuments({ coupleId });

    res.json({
      msg: 'Chat history retrieved',
      messages: messages.reverse(),
      pagination: {
        total: totalMessages,
        count: messages.length,
        skip: parseInt(skip),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('🔥 Get chat history error:', error.message);
    res.status(500).json({
      msg: 'Error fetching chat history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/chat/send
 * Save a message (backup for Socket.io)
 * Auth: Required
 * Body: { coupleId, content }
 */
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { coupleId, content } = req.body;
    const senderId = req.user.id; // From JWT token

    console.log('💬 Send message in couple:', coupleId);

    // Validation
    if (!coupleId || !content) {
      return res.status(400).json({
        msg: 'Couple ID and message content are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({
        msg: 'Message cannot be empty',
        code: 'EMPTY_MESSAGE'
      });
    }

    // Verify couple exists
    const couple = await Couple.findById(coupleId);
    if (!couple) {
      return res.status(404).json({
        msg: 'Couple not found',
        code: 'COUPLE_NOT_FOUND'
      });
    }

    // Verify sender is part of couple
    const isPartOfCouple =
      couple.user1Id.toString() === senderId ||
      couple.user2Id.toString() === senderId;

    if (!isPartOfCouple) {
      return res.status(403).json({
        msg: 'You are not part of this couple',
        code: 'UNAUTHORIZED'
      });
    }

    // Create and save message
    const message = new Message({
      coupleId,
      senderId,
      content: content.trim()
    });

    await message.save();
    await message.populate('senderId', 'name initials email profileColor _id');

    console.log('✅ Message saved:', message._id);

    res.status(201).json({
      msg: 'Message sent successfully',
      message: {
        _id: message._id,
        coupleId: message.coupleId,
        senderId: message.senderId,
        content: message.content,
        timestamp: message.timestamp,
        read: message.read
      }
    });
  } catch (error) {
    console.error('🔥 Send message error:', error.message);
    res.status(500).json({
      msg: 'Error sending message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/chat/mark-read/:coupleId
 * Mark all messages in a couple as read
 * Auth: Required
 */
router.put('/mark-read/:coupleId', authMiddleware, async (req, res) => {
  try {
    const { coupleId } = req.params;

    console.log('✓ Marking messages as read for couple:', coupleId);

    // Verify user is part of this couple
    const couple = await Couple.findById(coupleId);
    if (!couple) {
      return res.status(404).json({
        msg: 'Couple not found',
        code: 'COUPLE_NOT_FOUND'
      });
    }

    const isPartOfCouple =
      couple.user1Id.toString() === req.user.id ||
      couple.user2Id.toString() === req.user.id;

    if (!isPartOfCouple) {
      return res.status(403).json({
        msg: 'You are not authorized',
        code: 'UNAUTHORIZED'
      });
    }

    const result = await Message.updateMany(
      { coupleId, read: false },
      { read: true }
    );

    console.log('✅ Marked', result.modifiedCount, 'messages as read');

    res.json({
      msg: 'Messages marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('🔥 Mark read error:', error.message);
    res.status(500).json({
      msg: 'Error marking messages as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/chat/unread-count/:coupleId
 * Get count of unread messages
 * Auth: Required
 */
router.get('/unread-count/:coupleId', authMiddleware, async (req, res) => {
  try {
    const { coupleId } = req.params;

    const unreadCount = await Message.countDocuments({
      coupleId,
      read: false,
      senderId: { $ne: req.user.id }
    });

    res.json({
      msg: 'Unread count retrieved',
      coupleId,
      unreadCount
    });
  } catch (error) {
    console.error('🔥 Unread count error:', error.message);
    res.status(500).json({
      msg: 'Error fetching unread count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
