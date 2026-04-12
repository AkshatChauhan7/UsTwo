const mongoose = require('mongoose');

const MemorySchema = new mongoose.Schema({
  coupleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Couple',
    required: true,
    index: true
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  caption: {
    type: String,
    required: true,
    trim: true,
    maxlength: 180
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  isMilestone: {
    type: Boolean,
    default: false
  },
  heartCount: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

MemorySchema.index({ coupleId: 1, date: -1 });
MemorySchema.index({ coupleId: 1, isMilestone: 1, date: -1 });

module.exports = mongoose.models.Memory || mongoose.model('Memory', MemorySchema);
