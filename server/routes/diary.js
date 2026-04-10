const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const Couple = require('../models/Couple');
const DiaryEntry = require('../models/DiaryEntry');

const getDateRange = (dateInput) => {
  const base = dateInput ? new Date(dateInput) : new Date();
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(base);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const ensureUserInCouple = async (userId, coupleId) => {
  const couple = await Couple.findById(coupleId);
  if (!couple) {
    return { ok: false, status: 404, msg: 'Couple not found', code: 'COUPLE_NOT_FOUND' };
  }

  const isMember =
    couple.user1Id?.toString() === userId ||
    couple.user2Id?.toString() === userId;

  if (!isMember) {
    return { ok: false, status: 403, msg: 'Unauthorized for this couple', code: 'UNAUTHORIZED' };
  }

  return {
    ok: true,
    side: couple.user1Id?.toString() === userId ? 'left' : 'right'
  };
};

router.get('/:coupleId', authMiddleware, async (req, res) => {
  try {
    const { coupleId } = req.params;
    const { date } = req.query;

    const access = await ensureUserInCouple(req.user.id, coupleId);
    if (!access.ok) {
      return res.status(access.status).json({ msg: access.msg, code: access.code });
    }

    const { start, end } = getDateRange(date);

    const entry = await DiaryEntry.findOne({
      coupleId,
      date: { $gte: start, $lte: end }
    }).lean();

    return res.json({
      msg: 'Diary entry fetched',
      side: access.side,
      entry: entry || {
        coupleId,
        date: start,
        leftContent: '',
        rightContent: '',
        comments: []
      }
    });
  } catch (error) {
    console.error('🔥 Fetch diary error:', error.message);
    return res.status(500).json({
      msg: 'Error fetching diary entry',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.put('/:coupleId', authMiddleware, async (req, res) => {
  try {
    const { coupleId } = req.params;
    const { date, content } = req.body;

    const access = await ensureUserInCouple(req.user.id, coupleId);
    if (!access.ok) {
      return res.status(access.status).json({ msg: access.msg, code: access.code });
    }

    if (typeof content !== 'string') {
      return res.status(400).json({ msg: 'content is required', code: 'MISSING_CONTENT' });
    }

    const { start, end } = getDateRange(date);

    const update = access.side === 'left'
      ? { leftContent: content }
      : { rightContent: content };

    const entry = await DiaryEntry.findOneAndUpdate(
      { coupleId, date: { $gte: start, $lte: end } },
      {
        $set: {
          ...update,
          coupleId,
          date: start,
          updatedAt: new Date()
        },
        $setOnInsert: {
          comments: []
        }
      },
      { upsert: true, new: true }
    );

    return res.json({ msg: 'Diary content updated', side: access.side, entry });
  } catch (error) {
    console.error('🔥 Update diary content error:', error.message);
    return res.status(500).json({
      msg: 'Error updating diary content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/:coupleId/comment', authMiddleware, async (req, res) => {
  try {
    const { coupleId } = req.params;
    const { date, targetPage, text, x, y, xPos, yPos, zIndex } = req.body;

    const access = await ensureUserInCouple(req.user.id, coupleId);
    if (!access.ok) {
      return res.status(access.status).json({ msg: access.msg, code: access.code });
    }

    if (!['left', 'right'].includes(targetPage) || !text) {
      return res.status(400).json({ msg: 'targetPage and text are required', code: 'MISSING_FIELDS' });
    }

    const rawX = x ?? xPos;
    const rawY = y ?? yPos;
    const normalizedX = Math.max(0, Math.min(100, Number(rawX)));
    const normalizedY = Math.max(0, Math.min(100, Number(rawY)));

    const { start, end } = getDateRange(date);

    const comment = {
      authorId: req.user.id,
      targetPage,
      text: text.trim(),
      x: normalizedX,
      y: normalizedY,
      zIndex: Number.isFinite(Number(zIndex)) ? Math.max(1, Number(zIndex)) : 1,
      createdAt: new Date()
    };

    const entry = await DiaryEntry.findOneAndUpdate(
      { coupleId, date: { $gte: start, $lte: end } },
      {
        $setOnInsert: {
          coupleId,
          date: start,
          leftContent: '',
          rightContent: ''
        },
        $push: { comments: comment },
        $set: { updatedAt: new Date() }
      },
      { upsert: true, new: true }
    );

    const savedComment = entry.comments[entry.comments.length - 1];

    return res.status(201).json({
      msg: 'Diary comment added',
      comment: savedComment,
      entry
    });
  } catch (error) {
    console.error('🔥 Add diary comment error:', error.message);
    return res.status(500).json({
      msg: 'Error adding diary comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.put('/:coupleId/comment/:commentId/move', authMiddleware, async (req, res) => {
  try {
    const { coupleId, commentId } = req.params;
    const { date, x, y, zIndex } = req.body;

    const access = await ensureUserInCouple(req.user.id, coupleId);
    if (!access.ok) {
      return res.status(access.status).json({ msg: access.msg, code: access.code });
    }

    const normalizedX = Math.max(0, Math.min(100, Number(x)));
    const normalizedY = Math.max(0, Math.min(100, Number(y)));
    const normalizedZ = Number.isFinite(Number(zIndex)) ? Math.max(1, Number(zIndex)) : 1;

    const { start, end } = getDateRange(date);

    const entry = await DiaryEntry.findOneAndUpdate(
      {
        coupleId,
        date: { $gte: start, $lte: end },
        'comments._id': commentId
      },
      {
        $set: {
          'comments.$.x': normalizedX,
          'comments.$.y': normalizedY,
          'comments.$.zIndex': normalizedZ,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({ msg: 'Diary comment not found', code: 'COMMENT_NOT_FOUND' });
    }

    const movedComment = entry.comments.find((comment) => comment._id.toString() === commentId.toString());

    return res.json({
      msg: 'Diary comment moved',
      comment: movedComment
    });
  } catch (error) {
    console.error('🔥 Move diary comment error:', error.message);
    return res.status(500).json({
      msg: 'Error moving diary comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
