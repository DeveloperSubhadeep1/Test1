const mongoose = require('mongoose');

// In a real-world application, you should NEVER store passwords in plain text.
// Use a library like bcrypt to hash passwords before saving them.
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: 'avatar1',
  },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);