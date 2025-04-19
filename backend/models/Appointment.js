const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    type: { type: String, enum: ['in_person', 'virtual'], required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
    jitsiRoom: { type: String },
    amount: { type: Number, default: 500 }, // ₺ cinsinden ücret
    isPaid: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
