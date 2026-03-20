const router = require('express').Router();
const User = require('../models/User');
const Couple = require('../models/Couple');
const crypto = require('crypto');

// Generate invite code
router.post('/generate-invite', async (req, res) => {
  try {
    const userId = req.body.userId; // Should come from JWT token in production

    if (!userId) {
      return res.status(400).json({ msg: 'User ID required' });
    }

    // Check if user already has a couple
    const existingCouple = await Couple.findOne({ 
      $or: [{ user1Id: userId }, { user2Id: userId }]
    });

    if (existingCouple) {
      return res.status(400).json({ msg: 'User already has a partner' });
    }

    // Generate unique invite code
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Create new couple with user1
    const newCouple = new Couple({
      user1Id: userId,
      inviteCode,
      status: 'pending'
    });

    await newCouple.save();
    console.log('✅ Couple created:', inviteCode);

    res.status(201).json({
      msg: 'Invite code generated',
      inviteCode,
      coupleId: newCouple._id
    });
  } catch (error) {
    console.error('🔥 Generate invite error:', error.message);
    res.status(500).json({ msg: 'Error generating invite code', error: error.message });
  }
});

// Accept invite code
router.post('/accept-invite', async (req, res) => {
  try {
    const { userId, inviteCode } = req.body;

    if (!userId || !inviteCode) {
      return res.status(400).json({ msg: 'User ID and invite code required' });
    }

    // Find couple by invite code
    const couple = await Couple.findOne({ inviteCode });

    if (!couple) {
      return res.status(404).json({ msg: 'Invalid invite code' });
    }

    if (couple.status === 'connected') {
      return res.status(400).json({ msg: 'Couple already connected' });
    }

    if (couple.user1Id.toString() === userId) {
      return res.status(400).json({ msg: 'Cannot join your own invite' });
    }

    // Check if user already has a couple
    const userCouple = await Couple.findOne({
      $or: [{ user1Id: userId }, { user2Id: userId }]
    });

    if (userCouple) {
      return res.status(400).json({ msg: 'User already has a partner' });
    }

    // Update couple
    couple.user2Id = userId;
    couple.status = 'connected';
    couple.connectedAt = new Date();
    couple.inviteCode = null; // Remove invite code after connection
    await couple.save();

    // Update both users
    await User.findByIdAndUpdate(couple.user1Id, { coupleId: couple._id });
    await User.findByIdAndUpdate(userId, { coupleId: couple._id, partnerId: couple.user1Id });

    console.log('✅ Couple connected:', couple._id);

    res.status(200).json({
      msg: 'Successfully joined couple',
      coupleId: couple._id,
      couple: {
        _id: couple._id,
        user1Id: couple.user1Id,
        user2Id: couple.user2Id,
        status: couple.status,
        connectedAt: couple.connectedAt
      }
    });
  } catch (error) {
    console.error('🔥 Accept invite error:', error.message);
    res.status(500).json({ msg: 'Error accepting invite', error: error.message });
  }
});

// Get couple info
router.get('/info/:coupleId', async (req, res) => {
  try {
    const { coupleId } = req.params;

    const couple = await Couple.findById(coupleId)
      .populate('user1Id', 'name email initials')
      .populate('user2Id', 'name email initials');

    if (!couple) {
      return res.status(404).json({ msg: 'Couple not found' });
    }

    res.json({
      couple: {
        _id: couple._id,
        user1: couple.user1Id,
        user2: couple.user2Id,
        status: couple.status,
        createdAt: couple.createdAt,
        connectedAt: couple.connectedAt
      }
    });
  } catch (error) {
    console.error('Get couple info error:', error.message);
    res.status(500).json({ msg: 'Error fetching couple info', error: error.message });
  }
});

// Get user's couple
router.get('/my-couple/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const couple = await Couple.findOne({
      $or: [{ user1Id: userId }, { user2Id: userId }]
    })
      .populate('user1Id', 'name email initials')
      .populate('user2Id', 'name email initials');

    if (!couple) {
      return res.status(404).json({ msg: 'No couple found' });
    }

    res.json({
      couple: {
        _id: couple._id,
        user1: couple.user1Id,
        user2: couple.user2Id,
        status: couple.status,
        createdAt: couple.createdAt,
        connectedAt: couple.connectedAt
      }
    });
  } catch (error) {
    console.error('Get my couple error:', error.message);
    res.status(500).json({ msg: 'Error fetching couple', error: error.message });
  }
});

module.exports = router;
