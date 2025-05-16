const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  categories: {
    communication: { type: Number, min: 1, max: 5 },
    professionalism: { type: Number, min: 1, max: 5 },
    helpfulness: { type: Number, min: 1, max: 5 },
    knowledge: { type: Number, min: 1, max: 5 }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Prevent multiple ratings for the same appointment
RatingSchema.index({ appointment: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);