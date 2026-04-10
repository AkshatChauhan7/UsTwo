const mongoose = require('mongoose');

const QueueItemSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  title: { type: String, default: 'Untitled', trim: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addedAt: { type: Date, default: Date.now }
}, { _id: true });

const CinemaStateSchema = new mongoose.Schema({
  coupleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Couple',
    required: true,
    unique: true
  },
  queue: {
    type: [QueueItemSchema],
    default: []
  },
  currentIndex: {
    type: Number,
    default: 0,
    min: 0
  },
  isPlaying: {
    type: Boolean,
    default: false
  },
  currentTime: {
    type: Number,
    default: 0,
    min: 0
  },
  volume: {
    type: Number,
    default: 0.8,
    min: 0,
    max: 1
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

CinemaStateSchema.index({ updatedAt: -1 });

CinemaStateSchema.pre('save', function() {
  this.updatedAt = new Date();
});

module.exports = mongoose.models.CinemaState || mongoose.model('CinemaState', CinemaStateSchema);
