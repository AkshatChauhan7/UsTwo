const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  coupleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Couple', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      emoji: { type: String, required: true }
    }
  ],
  edited: { type: Boolean, default: false },
  editedAt: { type: Date, default: null },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
});

// Index for efficient message retrieval
MessageSchema.index({ coupleId: 1, timestamp: -1 });

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);
