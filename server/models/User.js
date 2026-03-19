const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  initials: { type: String },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  coupleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Couple', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);