const mongoose = require('mongoose');

const TherapistApplicationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    specialization: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    description: { type: String },
    approved: { type: Boolean, default: false },
    rejected: { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.model('TherapistApplication', TherapistApplicationSchema)