const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const Couple = require('../models/Couple');
const Memory = require('../models/Memory');

const memoriesDir = path.join(__dirname, '../uploads/memories');
fs.mkdirSync(memoriesDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, memoriesDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `memory-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  }
});

const deleteMemoryFileIfLocal = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return;
  if (!imageUrl.startsWith('/uploads/memories/')) return;

  const filePath = path.join(__dirname, '..', imageUrl);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const ensureUserInCouple = async (userId, coupleId) => {
  const couple = await Couple.findById(coupleId);
  if (!couple) {
    return { ok: false, status: 404, msg: 'Couple not found', code: 'COUPLE_NOT_FOUND' };
  }

  const allowed =
    couple.user1Id?.toString() === userId ||
    couple.user2Id?.toString() === userId;

  if (!allowed) {
    return { ok: false, status: 403, msg: 'Unauthorized for this couple', code: 'UNAUTHORIZED' };
  }

  return { ok: true };
};

/**
 * GET /api/memories/:coupleId
 * List all memories for a couple ordered by date asc
 */
router.get('/:coupleId', authMiddleware, async (req, res) => {
  try {
    const { coupleId } = req.params;

    const access = await ensureUserInCouple(req.user.id, coupleId);
    if (!access.ok) {
      return res.status(access.status).json({ msg: access.msg, code: access.code });
    }

    const memories = await Memory.find({ coupleId })
      .sort({ date: 1, createdAt: 1 })
      .lean();

    return res.json({
      msg: 'Memories fetched',
      count: memories.length,
      memories
    });
  } catch (error) {
    console.error('🔥 Fetch memories error:', error.message);
    return res.status(500).json({
      msg: 'Error fetching memories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/memories
 * Create a new memory
 * Body: { coupleId, imageUrl, caption, date, isMilestone }
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { coupleId, imageUrl, caption, date, isMilestone = false } = req.body;

    if (!coupleId || !imageUrl || !caption) {
      return res.status(400).json({ msg: 'coupleId, imageUrl and caption are required', code: 'MISSING_FIELDS' });
    }

    const access = await ensureUserInCouple(req.user.id, coupleId);
    if (!access.ok) {
      return res.status(access.status).json({ msg: access.msg, code: access.code });
    }

    const memory = await Memory.create({
      coupleId,
      imageUrl: imageUrl.trim(),
      caption: caption.trim(),
      date: date ? new Date(date) : new Date(),
      isMilestone: Boolean(isMilestone),
      createdBy: req.user.id
    });

    return res.status(201).json({ msg: 'Memory created', memory });
  } catch (error) {
    console.error('🔥 Create memory error:', error.message);
    return res.status(500).json({
      msg: 'Error creating memory',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/memories/upload
 * Upload a local photo and create memory
 * multipart/form-data: { image, coupleId, caption, date, isMilestone }
 */
router.post('/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { coupleId, caption, date, isMilestone = false } = req.body;

    if (!coupleId || !caption || !req.file) {
      return res.status(400).json({
        msg: 'coupleId, caption and image file are required',
        code: 'MISSING_FIELDS'
      });
    }

    const access = await ensureUserInCouple(req.user.id, coupleId);
    if (!access.ok) {
      return res.status(access.status).json({ msg: access.msg, code: access.code });
    }

    const relativePath = `/uploads/memories/${req.file.filename}`;

    const memory = await Memory.create({
      coupleId,
      imageUrl: relativePath,
      caption: caption.trim(),
      date: date ? new Date(date) : new Date(),
      isMilestone: String(isMilestone) === 'true',
      createdBy: req.user.id
    });

    return res.status(201).json({ msg: 'Memory created from upload', memory });
  } catch (error) {
    console.error('🔥 Upload memory error:', error.message);
    return res.status(500).json({
      msg: 'Error uploading memory image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/memories/:memoryId/heart
 * Increment heart reaction count
 */
router.put('/:memoryId/heart', authMiddleware, async (req, res) => {
  try {
    const { memoryId } = req.params;

    const memory = await Memory.findById(memoryId);
    if (!memory) {
      return res.status(404).json({ msg: 'Memory not found', code: 'MEMORY_NOT_FOUND' });
    }

    const access = await ensureUserInCouple(req.user.id, memory.coupleId);
    if (!access.ok) {
      return res.status(access.status).json({ msg: access.msg, code: access.code });
    }

    memory.heartCount += 1;
    await memory.save();

    return res.json({
      msg: 'Heart added',
      memoryId: memory._id,
      heartCount: memory.heartCount
    });
  } catch (error) {
    console.error('🔥 Heart memory error:', error.message);
    return res.status(500).json({
      msg: 'Error updating memory heart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/memories/:memoryId
 * Delete one memory
 */
router.delete('/:memoryId', authMiddleware, async (req, res) => {
  try {
    const { memoryId } = req.params;

    const memory = await Memory.findById(memoryId);
    if (!memory) {
      return res.status(404).json({ msg: 'Memory not found', code: 'MEMORY_NOT_FOUND' });
    }

    const access = await ensureUserInCouple(req.user.id, memory.coupleId);
    if (!access.ok) {
      return res.status(access.status).json({ msg: access.msg, code: access.code });
    }

    deleteMemoryFileIfLocal(memory.imageUrl);
    await Memory.findByIdAndDelete(memoryId);

    return res.json({
      msg: 'Memory deleted',
      memoryId
    });
  } catch (error) {
    console.error('🔥 Delete memory error:', error.message);
    return res.status(500).json({
      msg: 'Error deleting memory',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/memories/couple/:coupleId
 * Delete all memories for a couple
 */
router.delete('/couple/:coupleId', authMiddleware, async (req, res) => {
  try {
    const { coupleId } = req.params;

    const access = await ensureUserInCouple(req.user.id, coupleId);
    if (!access.ok) {
      return res.status(access.status).json({ msg: access.msg, code: access.code });
    }

    const memories = await Memory.find({ coupleId }).lean();
    memories.forEach((memory) => deleteMemoryFileIfLocal(memory.imageUrl));

    const result = await Memory.deleteMany({ coupleId });

    return res.json({
      msg: 'All memories cleared',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('🔥 Clear memories error:', error.message);
    return res.status(500).json({
      msg: 'Error clearing memories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
