const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  initials: { type: String }
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);