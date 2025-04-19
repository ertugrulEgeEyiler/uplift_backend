const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['in_person', 'virtual'],
    required: true
  },
  mode: {
    type: String,
    enum: ['individual', 'group'],
    default: 'individual'
  },
  maxParticipants: {
    type: Number,
    default: 1,
    validate: {
      validator: function (value) {
        return this.mode === 'group' ? value > 1 : value === 1;
      },
      message: 'For group mode, maxParticipants must be > 1. For individual, it must be 1.'
    }
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'cancelled'],
    default: 'available'
  }
}, { timestamps: true });

module.exports = mongoose.model('Slot', SlotSchema);
