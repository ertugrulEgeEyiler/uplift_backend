const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
    therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isRecurring: { type: Boolean, default: false },
    recurrencePattern: { type: String, enum: ['daily', 'weekly', 'none'], default: 'none' },
    isBlocked: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Availability', AvailabilitySchema);