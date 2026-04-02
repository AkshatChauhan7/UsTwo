const mongoose = require('mongoose');
const crypto = require('crypto');

const CoupleSchema = new mongoose.Schema({
  user1Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'connected'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  connectedAt: {
    type: Date,
    default: null
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
CoupleSchema.index({ user1Id: 1 });
CoupleSchema.index({ user2Id: 1 });
CoupleSchema.index({ inviteCode: 1 });
CoupleSchema.index({ status: 1 });
CoupleSchema.index({ createdAt: -1 });

// Generate unique invite code before saving if not already set
CoupleSchema.pre('save', async function() {
  if (!this.inviteCode) {
    // Generate a 6-character alphanumeric code
    this.inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  }
  this.lastActivityAt = new Date();
});

module.exports = mongoose.models.Couple || mongoose.model('Couple', CoupleSchema);
