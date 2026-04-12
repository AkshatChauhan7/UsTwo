const mongoose = require('mongoose');

const deriveStatus = (checks = []) => {
  const count = Array.isArray(checks) ? checks.length : 0;
  if (count <= 0) return 'pending';
  if (count === 1) return 'half-done';
  return 'completed';
};

const BucketListItemSchema = new mongoose.Schema({
  coupleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Couple',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 140
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: 320
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checks: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'half-done', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

BucketListItemSchema.index({ coupleId: 1, createdAt: -1 });

BucketListItemSchema.pre('save', function() {
  this.status = deriveStatus(this.checks);
  this.updatedAt = new Date();
});

BucketListItemSchema.statics.deriveStatus = deriveStatus;

module.exports = mongoose.models.BucketListItem || mongoose.model('BucketListItem', BucketListItemSchema);
