const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const Slot = require('../models/Slot');
const Appointment = require('../models/Appointment');

// Therapist creates a slot
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { date, startTime, endTime, type, mode, maxParticipants, price } = req.body;

    if (req.user.role !== 'therapist') {
      return res.status(403).json({ message: 'Only therapists can create slots.' });
    }

    const overlap = await Slot.findOne({
      therapist: req.user.id,
      date: new Date(date),
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
      status: 'available'
    });

    if (overlap) {
      return res.status(409).json({ message: 'Overlapping slot exists.' });
    }

    const slot = new Slot({
      therapist: req.user.id,
      date,
      startTime,
      endTime,
      type,
      mode,
      maxParticipants: mode === 'group' ? maxParticipants : 1,
      price
    });

    await slot.save();
    res.status(201).json({ message: 'Slot created.', slot });
  } catch (error) {
    console.error('Slot creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Therapist deletes own slot (if no bookings)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    if (slot.therapist.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own slots.' });
    }

    const hasBookings = await Appointment.exists({ slot: slot._id, status: 'booked' });
    if (hasBookings) {
      return res.status(400).json({ message: 'Slot has bookings and cannot be deleted.' });
    }

    await slot.deleteOne();
    res.status(200).json({ message: 'Slot deleted.' });
  } catch (error) {
    console.error('Slot deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all slots (admin or user view)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const slots = await Slot.find().populate('therapist', 'username email');
    res.status(200).json(slots);
  } catch (error) {
    console.error('Get all slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all available slots (excluding own slots)
router.get('/available', authMiddleware, async (req, res) => {
  try {
    const slots = await Slot.find({
      status: 'available',
      therapist: { $ne: req.user.id }
    }).lean();

    const enriched = await Promise.all(slots.map(async slot => {
      const count = await Appointment.countDocuments({ slot: slot._id, status: 'booked' });
      return {
        ...slot,
        isFull: count >= slot.maxParticipants,
        bookedCount: count
      };
    }));

    res.status(200).json(enriched);
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get therapist's own slots
router.get('/my', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'therapist') {
      return res.status(403).json({ message: 'Only therapists can view their slots.' });
    }

    const slots = await Slot.find({ therapist: req.user.id }).sort({ date: 1, startTime: 1 });
    res.status(200).json(slots);
  } catch (error) {
    console.error('My slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/therapist/:id', async (req, res) => {
  try {
    // Fetch slots
    const slots = await Slot.find({ 
      therapist: req.params.id,
      // Only include future or today's slots
      date: { $gte: new Date().toISOString().split('T')[0] }
    }).sort({ date: 1, startTime: 1 });

    // Check if there are appointments for these slots to determine status
    const appointmentPromises = slots.map(async (slot) => {
      const appointment = await Appointment.findOne({ 
        slot: slot._id,
        status: 'booked'
      });
      
      return {
        id: slot._id,
        title: appointment ? 'Booked Appointment' : 'Available Slot',
        // Create proper date objects from date and time strings
        start: new Date(`${slot.date.toISOString().split('T')[0]}T${slot.startTime}:00`),
        end: new Date(`${slot.date.toISOString().split('T')[0]}T${slot.endTime}:00`),
        status: appointment ? 'booked' : 'available',
        slotInfo: {
          type: slot.type,
          mode: slot.mode,
          price: slot.price,
          maxParticipants: slot.maxParticipants
        }
      };
    });

    // Resolve all promises
    const formattedSlots = await Promise.all(appointmentPromises);
    
    res.status(200).json(formattedSlots);
  } catch (error) {
    console.error('Therapist slots fetch error:', error);
    res.status(500).json({ message: 'Server Error!' });
  }
});

module.exports = router;