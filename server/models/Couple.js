const mongoose = require('mongoose');

const CoupleSchema = new mongoose.Schema({
  user1Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  inviteCode: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['pending', 'connected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  connectedAt: { type: Date, default: null }
});

module.exports = mongoose.models.Couple || mongoose.model('Couple', CoupleSchema);
