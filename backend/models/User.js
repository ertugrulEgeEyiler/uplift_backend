const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  age: { type: Number },
  gender: { type: String },
  phone: { type: String },
  description: { type: String },
  location: {
    city: { type: String },
    country: { type: String },
  },
  languages: [{ type: String }],
  role: { type: String, enum: ['user', 'patient', 'therapist', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
