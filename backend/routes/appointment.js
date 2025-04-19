const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');

// Get user's appointments
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const query = req.user.role === 'therapist'
      ? { therapist: req.user.id, status: 'booked' }
      : { patient: req.user.id, status: 'booked' };

    const appointments = await Appointment.find(query)
      .populate('slot')
      .populate('therapist', 'username email')
      .populate('patient', 'username email');

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Get active appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointment by ID (only if participant)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('slot')
      .populate('therapist', 'username email')
      .populate('patient', 'username email');

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const isOwner = [appointment.patient?.toString(), appointment.therapist?.toString()].includes(req.user.id);
    if (!isOwner) return res.status(403).json({ message: 'Access denied' });

    res.status(200).json(appointment);
  } catch (error) {
    console.error('Get appointment by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel appointment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const now = new Date();
    const slot = await Slot.findById(appointment.slot);
    const appointmentDateTime = new Date(`${slot.date.toISOString().split('T')[0]}T${slot.startTime}:00`);
    const hoursBefore = (appointmentDateTime - now) / (1000 * 60 * 60);

    const isTherapist = appointment.therapist.toString() === req.user.id;
    const isPatient = appointment.patient.toString() === req.user.id;

    if (isTherapist || (isPatient && hoursBefore >= 48)) {
      await appointment.deleteOne();
      return res.status(200).json({ message: 'Appointment cancelled.' });
    } else {
      return res.status(403).json({ message: 'You cannot cancel this appointment at this time.' });
    }
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all participants of a slot (therapist only)
router.get('/slot/:slotId', authMiddleware, async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.slotId);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });

    if (slot.therapist.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only view participants of your own slot' });
    }

    const participants = await Appointment.find({
      slot: req.params.slotId,
      status: 'booked'
    }).populate('patient', 'username email');

    res.status(200).json(participants);
  } catch (error) {
    console.error('Slot participant fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;