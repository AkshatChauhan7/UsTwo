const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Couple = require('../models/Couple');
const BucketListItem = require('../models/BucketListItem');

const ensureUserInCouple = async (userId, coupleId) => {
  const couple = await Couple.findById(coupleId).lean();
  if (!couple) {
    return { ok: false, status: 404, msg: 'Couple not found', code: 'COUPLE_NOT_FOUND' };
  }

  const isMember =
    couple.user1Id?.toString() === userId ||
    couple.user2Id?.toString() === userId;

  if (!isMember) {
    return { ok: false, status: 403, msg: 'Unauthorized for this couple', code: 'UNAUTHORIZED' };
  }

  return { ok: true, couple };
};

const getCurrentUserWithCouple = async (userId) => {
  const user = await User.findById(userId).select('coupleId').lean();

  if (!user) {
    return { ok: false, status: 404, msg: 'User not found', code: 'USER_NOT_FOUND' };
  }

  if (!user.coupleId) {
    return { ok: false, status: 400, msg: 'No couple connected', code: 'NO_COUPLE' };
  }

  return { ok: true, user };
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userInfo = await getCurrentUserWithCouple(req.user.id);
    if (!userInfo.ok) {
      return res.status(userInfo.status).json({ msg: userInfo.msg, code: userInfo.code });
    }

    const coupleId = userInfo.user.coupleId;
    const access = await ensureUserInCouple(req.user.id, coupleId.toString());
    if (!access.ok) {
      return res.status(access.status).json({ msg: access.msg, code: access.code });
    }

    const items = await BucketListItem.find({ coupleId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      msg: 'Bucket list fetched',
      count: items.length,
      items
    });
  } catch (error) {
    console.error('🔥 Fetch bucket list error:', error.message);
    return res.status(500).json({
      msg: 'Error fetching bucket list',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description = '' } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ msg: 'title is required', code: 'MISSING_TITLE' });
    }

    const userInfo = await getCurrentUserWithCouple(req.user.id);
    if (!userInfo.ok) {
      return res.status(userInfo.status).json({ msg: userInfo.msg, code: userInfo.code });
    }

    const coupleId = userInfo.user.coupleId;
    const access = await ensureUserInCouple(req.user.id, coupleId.toString());
    if (!access.ok) {
      return res.status(access.status).json({ msg: access.msg, code: access.code });
    }

    const item = await BucketListItem.create({
      coupleId,
      title: String(title).trim(),
      description: String(description || '').trim(),
      createdBy: req.user.id,
      checks: [],
      status: 'pending'
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`couple-${coupleId}`).emit('bucket-item-added', item.toObject());
    }

    return res.status(201).json({ msg: 'Bucket list item created', item });
  } catch (error) {
    console.error('🔥 Create bucket item error:', error.message);
    return res.status(500).json({
      msg: 'Error creating bucket list item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await BucketListItem.findById(id);
    if (!item) {
      return res.status(404).json({ msg: 'Bucket list item not found', code: 'ITEM_NOT_FOUND' });
    }

    const access = await ensureUserInCouple(req.user.id, item.coupleId.toString());
    if (!access.ok) {
      return res.status(access.status).json({ msg: access.msg, code: access.code });
    }

    await BucketListItem.findByIdAndDelete(id);

    const io = req.app.get('io');
    if (io) {
      io.to(`couple-${item.coupleId}`).emit('bucket-item-deleted', { itemId: id });
    }

    return res.json({
      msg: 'Bucket list item deleted',
      itemId: id
    });
  } catch (error) {
    console.error('🔥 Delete bucket item error:', error.message);
    return res.status(500).json({
      msg: 'Error deleting bucket list item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;