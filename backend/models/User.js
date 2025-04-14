const mongoose = require('mongoose');

const UserChema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'patient', 'therapist', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', UserChema);