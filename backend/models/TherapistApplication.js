const mongoose = require('mongoose');

const TherapistApplicationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    age: { type: Number },
    gender: { type: String },
    specialization: [{ type: String, required: true }],
    languages: [{ type: String }],
    location: {
        city: { type: String },
        country: { type: String },
    },
    licenseNumber: { type: String, required: true },
    description: { type: String },
    certificateUrl: { type: String },
    approved: { type: Boolean, default: false },
    rejected: { type: Boolean, default: false },
    ratingAverage: { type: Number, default: 0 }, // New field for average rating
    ratingCount: { type: Number, default: 0 }   // New field for count of ratings
}, { timestamps: true })

module.exports = mongoose.model('TherapistApplication', TherapistApplicationSchema)