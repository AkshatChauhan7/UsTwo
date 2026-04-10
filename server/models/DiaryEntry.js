const mongoose = require('mongoose');

const DiaryCommentSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetPage: {
    type: String,
    enum: ['left', 'right'],
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  x: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  y: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  zIndex: {
    type: Number,
    default: 1,
    min: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const DiaryEntrySchema = new mongoose.Schema({
  coupleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Couple',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  leftContent: {
    type: String,
    default: ''
  },
  rightContent: {
    type: String,
    default: ''
  },
  comments: {
    type: [DiaryCommentSchema],
    default: []
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

DiaryEntrySchema.index({ coupleId: 1, date: 1 }, { unique: true });

DiaryEntrySchema.pre('save', function() {
  this.updatedAt = new Date();
});

module.exports = mongoose.models.DiaryEntry || mongoose.model('DiaryEntry', DiaryEntrySchema);
