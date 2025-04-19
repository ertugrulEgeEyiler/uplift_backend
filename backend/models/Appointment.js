const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: true
  },
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['booked', 'cancelled', 'refunded'],
    default: 'booked'
  },
  paymentIntentId: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
