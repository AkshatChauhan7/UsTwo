const router = require('express').Router();
const Message = require('../models/Message');
const Couple = require('../models/Couple');

// Get chat history for a couple
router.get('/history/:coupleId', async (req, res) => {
  try {
    const { coupleId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Verify couple exists
    const couple = await Couple.findById(coupleId);
    if (!couple) {
      return res.status(404).json({ msg: 'Couple not found' });
    }

    // Get messages
    const messages = await Message.find({ coupleId })
      .populate('senderId', 'name initials email')
      .sort({ timestamp: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const totalMessages = await Message.countDocuments({ coupleId });

    res.json({
      messages: messages.reverse(),
      total: totalMessages,
      count: messages.length
    });
  } catch (error) {
    console.error('🔥 Get chat history error:', error.message);
    res.status(500).json({ msg: 'Error fetching chat history', error: error.message });
  }
});

// Save message (for when Socket.io isn't available or as backup)
router.post('/send', async (req, res) => {
  try {
    const { coupleId, senderId, content } = req.body;

    if (!coupleId || !senderId || !content) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }

    // Verify sender is part of couple
    const couple = await Couple.findById(coupleId);
    if (!couple) {
      return res.status(404).json({ msg: 'Couple not found' });
    }

    const isPartOfCouple = couple.user1Id.toString() === senderId || couple.user2Id.toString() === senderId;
    if (!isPartOfCouple) {
      return res.status(403).json({ msg: 'Not part of this couple' });
    }

    // Create and save message
    const message = new Message({
      coupleId,
      senderId,
      content
    });

    await message.save();
    await message.populate('senderId', 'name initials email');

    console.log('💬 Message saved:', coupleId);

    res.status(201).json({
      msg: 'Message sent',
      message
    });
  } catch (error) {
    console.error('🔥 Send message error:', error.message);
    res.status(500).json({ msg: 'Error sending message', error: error.message });
  }
});

// Mark messages as read
router.put('/mark-read/:coupleId', async (req, res) => {
  try {
    const { coupleId } = req.params;

    await Message.updateMany(
      { coupleId, read: false },
      { read: true }
    );

    res.json({ msg: 'Messages marked as read' });
  } catch (error) {
    console.error('🔥 Mark read error:', error.message);
    res.status(500).json({ msg: 'Error marking messages', error: error.message });
  }
});

module.exports = router;
