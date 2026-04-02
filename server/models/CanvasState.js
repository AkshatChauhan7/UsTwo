const mongoose = require('mongoose');

const CanvasStateSchema = new mongoose.Schema({
  coupleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Couple',
    required: true,
    unique: true
  },
  strokes: [
    {
      points: [
        {
          x: { type: Number, required: true },
          y: { type: Number, required: true },
          pressure: { type: Number, default: 1 }
        }
      ],
      color: {
        type: String,
        default: '#000000',
        match: /^#[0-9A-F]{6}$/i
      },
      size: {
        type: Number,
        default: 2,
        min: 1,
        max: 50
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  // For quick snapshot during session
  canvasSnapshot: {
    type: String,
    default: null // Base64 encoded canvas image
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isCleared: {
    type: Boolean,
    default: false
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

// Indexes
CanvasStateSchema.index({ coupleId: 1 });
CanvasStateSchema.index({ updatedAt: -1 });

// Update timestamp on any modification
CanvasStateSchema.pre('save', function() {
  this.updatedAt = new Date();
});

module.exports = mongoose.models.CanvasState || mongoose.model('CanvasState', CanvasStateSchema);
