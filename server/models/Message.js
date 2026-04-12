const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  coupleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Couple', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  type: {
    type: String,
    enum: ['text', 'image', 'video'],
    default: 'text'
  },
  fileUrl: { type: String, default: null },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video'],
    default: 'text'
  },
  mediaUrl: { type: String, default: null },
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

MessageSchema.pre('validate', function(next) {
  const normalizedType = this.type || this.messageType || 'text';
  this.type = normalizedType;
  this.messageType = normalizedType;

  const normalizedFileUrl = this.fileUrl || this.mediaUrl || null;
  this.fileUrl = normalizedFileUrl;
  this.mediaUrl = normalizedFileUrl;

  const hasText = Boolean(this.content && String(this.content).trim());
  const hasMedia = Boolean(normalizedFileUrl);

  if (!hasText && !hasMedia) {
    this.invalidate('content', 'Message must include text or media');
  }

  if (normalizedType === 'text' && hasMedia) {
    this.invalidate('type', 'Text message cannot include media');
  }

  if ((normalizedType === 'image' || normalizedType === 'video') && !hasMedia) {
    this.invalidate('fileUrl', 'Media URL is required for media messages');
  }

  next();
});

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);
