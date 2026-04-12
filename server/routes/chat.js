const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Message = require('../models/Message');
const Couple = require('../models/Couple');
const authMiddleware = require('../middleware/authMiddleware');

const chatUploadsDir = path.join(__dirname, '../uploads/chat');
fs.mkdirSync(chatUploadsDir, { recursive: true });

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_FILE_BYTES = 20 * 1024 * 1024;

const chatStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, chatUploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `chat-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const chatUpload = multer({
  storage: chatStorage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    const allowed = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only image/video uploads are allowed'));
    }
    return cb(null, true);
  }
});

const chatUploadSingle = (req, res, next) => {
  chatUpload.single('media')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ msg: 'Media file is too large (max 20MB)', code: 'FILE_TOO_LARGE' });
    }
    return res.status(400).json({ msg: err.message || 'Upload error', code: 'UPLOAD_ERROR' });
  });
};

const removeUploadedFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // no-op
  }
};

const buildAbsoluteFileUrl = (req, relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) return relativePath;
  return `${req.protocol}://${req.get('host')}${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
};

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
router.post('/send', authMiddleware, chatUploadSingle, async (req, res) => {
  try {
    const { coupleId, content = '', type: inputType } = req.body;
    const senderId = req.user.id; // From JWT token
    const trimmedContent = String(content || '').trim();
    const uploadedFile = req.file;

    console.log('💬 Send message in couple:', coupleId);

    // Validation
    if (!coupleId) {
      return res.status(400).json({
        msg: 'Couple ID is required',
        code: 'MISSING_FIELDS'
      });
    }

    if (!trimmedContent && !uploadedFile) {
      return res.status(400).json({
        msg: 'Message cannot be empty',
        code: 'EMPTY_MESSAGE'
      });
    }

    let messageType = inputType || 'text';
    if (uploadedFile) {
      messageType = IMAGE_MIME_TYPES.includes(uploadedFile.mimetype) ? 'image' : 'video';
    }

    if (!['text', 'image', 'video'].includes(messageType)) {
      removeUploadedFile(uploadedFile?.path);
      return res.status(400).json({
        msg: 'Invalid message type',
        code: 'INVALID_MESSAGE_TYPE'
      });
    }

    if (messageType === 'text' && !trimmedContent) {
      removeUploadedFile(uploadedFile?.path);
      return res.status(400).json({
        msg: 'Text message cannot be empty',
        code: 'EMPTY_MESSAGE'
      });
    }

    if ((messageType === 'image' || messageType === 'video') && !uploadedFile) {
      return res.status(400).json({
        msg: 'Media file is required',
        code: 'MISSING_MEDIA'
      });
    }

    // Verify couple exists
    const couple = await Couple.findById(coupleId);
    if (!couple) {
      removeUploadedFile(uploadedFile?.path);
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
      removeUploadedFile(uploadedFile?.path);
      return res.status(403).json({
        msg: 'You are not part of this couple',
        code: 'UNAUTHORIZED'
      });
    }

    const relativeFileUrl = uploadedFile ? `/uploads/chat/${uploadedFile.filename}` : null;
    const absoluteFileUrl = buildAbsoluteFileUrl(req, relativeFileUrl);

    // Create and save message
    const message = new Message({
      coupleId,
      senderId,
      content: trimmedContent,
      type: messageType,
      fileUrl: relativeFileUrl,
      messageType,
      mediaUrl: relativeFileUrl,
      readBy: [senderId]
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
        type: message.type || message.messageType,
        fileUrl: absoluteFileUrl || message.fileUrl || message.mediaUrl,
        messageType: message.messageType || message.type,
        mediaUrl: absoluteFileUrl || message.mediaUrl || message.fileUrl,
        timestamp: message.timestamp,
        read: message.read,
        readBy: message.readBy,
        reactions: message.reactions,
        edited: message.edited,
        deleted: message.deleted
      }
    });
  } catch (error) {
    if (req.file?.path) {
      removeUploadedFile(req.file.path);
    }
    console.error('🔥 Send message error:', error.message);
    res.status(500).json({
      msg: 'Error sending message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/send-media', authMiddleware, chatUploadSingle, async (req, res) => {
  try {
    const { coupleId, content = '' } = req.body;
    const senderId = req.user.id;
    const uploadedFile = req.file;
    const trimmedContent = String(content || '').trim();

    if (!coupleId) {
      return res.status(400).json({ msg: 'Couple ID is required', code: 'MISSING_FIELDS' });
    }

    if (!uploadedFile) {
      return res.status(400).json({ msg: 'Media file is required', code: 'MISSING_MEDIA' });
    }

    const messageType = IMAGE_MIME_TYPES.includes(uploadedFile.mimetype) ? 'image' : 'video';
    const relativeFileUrl = `/uploads/chat/${uploadedFile.filename}`;
    const absoluteFileUrl = buildAbsoluteFileUrl(req, relativeFileUrl);

    const couple = await Couple.findById(coupleId);
    if (!couple) {
      removeUploadedFile(uploadedFile.path);
      return res.status(404).json({ msg: 'Couple not found', code: 'COUPLE_NOT_FOUND' });
    }

    const isPartOfCouple =
      couple.user1Id.toString() === senderId ||
      couple.user2Id.toString() === senderId;

    if (!isPartOfCouple) {
      removeUploadedFile(uploadedFile.path);
      return res.status(403).json({ msg: 'You are not part of this couple', code: 'UNAUTHORIZED' });
    }

    const message = await Message.create({
      coupleId,
      senderId,
      content: trimmedContent,
      type: messageType,
      fileUrl: relativeFileUrl,
      messageType,
      mediaUrl: relativeFileUrl,
      readBy: [senderId]
    });

    await message.populate('senderId', 'name initials email profileColor _id');

    const payload = {
      _id: message._id,
      coupleId: message.coupleId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      fileUrl: absoluteFileUrl || message.fileUrl,
      messageType: message.messageType,
      mediaUrl: absoluteFileUrl || message.mediaUrl,
      timestamp: message.timestamp,
      read: message.read,
      readBy: message.readBy,
      reactions: message.reactions,
      edited: message.edited,
      deleted: message.deleted
    };

    const io = req.app.get('io');
    if (io) {
      io.to(`couple-${coupleId}`).emit('receive-message', payload);
    }

    return res.status(201).json({ msg: 'Media message sent successfully', message: payload });
  } catch (error) {
    if (req.file?.path) {
      removeUploadedFile(req.file.path);
    }
    console.error('🔥 Send media message error:', error.message);
    return res.status(500).json({
      msg: 'Error sending media message',
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
      { coupleId, senderId: { $ne: req.user.id }, read: false },
      {
        $set: { read: true, readAt: new Date() },
        $addToSet: { readBy: req.user.id }
      }
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

/**
 * PUT /api/chat/message/:messageId/react
 * Add/update/remove a reaction for authenticated user
 * Body: { emoji }
 */
router.put('/message/:messageId/react', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ msg: 'Emoji is required', code: 'MISSING_EMOJI' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ msg: 'Message not found', code: 'MESSAGE_NOT_FOUND' });
    }

    const couple = await Couple.findById(message.coupleId);
    if (!couple) {
      return res.status(404).json({ msg: 'Couple not found', code: 'COUPLE_NOT_FOUND' });
    }

    const isPartOfCouple =
      couple.user1Id.toString() === req.user.id ||
      couple.user2Id.toString() === req.user.id;

    if (!isPartOfCouple) {
      return res.status(403).json({ msg: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const existingReactionIndex = message.reactions.findIndex(
      (reaction) => reaction.userId.toString() === req.user.id
    );

    if (existingReactionIndex !== -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ userId: req.user.id, emoji });
    }

    await message.save();

    res.json({
      msg: 'Reaction updated',
      messageId: message._id,
      reactions: message.reactions
    });
  } catch (error) {
    console.error('🔥 React message error:', error.message);
    res.status(500).json({
      msg: 'Error reacting to message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/chat/message/:messageId
 * Edit own message
 * Body: { content }
 */
router.put('/message/:messageId', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ msg: 'Content is required', code: 'MISSING_CONTENT' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ msg: 'Message not found', code: 'MESSAGE_NOT_FOUND' });
    }

    if (message.senderId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'You can only edit your own messages', code: 'UNAUTHORIZED' });
    }

    if (message.deleted) {
      return res.status(400).json({ msg: 'Deleted message cannot be edited', code: 'MESSAGE_DELETED' });
    }

    message.content = content.trim();
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    res.json({
      msg: 'Message updated',
      message: {
        _id: message._id,
        content: message.content,
        edited: message.edited,
        editedAt: message.editedAt
      }
    });
  } catch (error) {
    console.error('🔥 Edit message error:', error.message);
    res.status(500).json({
      msg: 'Error editing message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/chat/message/:messageId
 * Soft delete own message
 */
router.delete('/message/:messageId', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ msg: 'Message not found', code: 'MESSAGE_NOT_FOUND' });
    }

    if (message.senderId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'You can only delete your own messages', code: 'UNAUTHORIZED' });
    }

    message.deleted = true;
    message.deletedAt = new Date();
    message.content = 'This message was deleted';
    await message.save();

    res.json({
      msg: 'Message deleted',
      message: {
        _id: message._id,
        deleted: message.deleted,
        deletedAt: message.deletedAt,
        content: message.content
      }
    });
  } catch (error) {
    console.error('🔥 Delete message error:', error.message);
    res.status(500).json({
      msg: 'Error deleting message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
