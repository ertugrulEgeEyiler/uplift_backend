const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const Appointment = require('../models/Appointment');
const Availability = require('../models/Availability');
const User = require('../models/User'); // 🔥 Rol güncellemesi için eklendi

router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      therapistId,
      date,
      startTime,
      endTime,
      type,
    } = req.body;

    console.log('📥 Gelen randevu isteği:', {
      therapistId,
      date,
      startTime,
      endTime,
      type
    });

    const user = await User.findById(req.user.id);

    if (user.role === 'therapist') {
      return res.status(403).json({ message: 'Therapists cannot book appointments.' });
    }

    // 🔍 Availability eşleşmesi (sadece gün karşılaştırması)
    const availableSlot = await Availability.findOne({
      therapist: therapistId,
      isBlocked: false,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      $expr: {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          date
        ]
      }
    });

    if (!availableSlot) {
      return res.status(400).json({ message: 'Selected time slot is busy.' });
    }

    // ❌ Çakışma kontrolü
    const conflict = await Appointment.findOne({
      therapist: therapistId,
      status: { $ne: 'cancelled' },
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      $expr: {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          date
        ]
      }
    });

    if (conflict) {
      return res.status(409).json({ message: 'This time slot is already booked.' });
    }

    // ✅ Randevuyu oluştur
    const newAppointment = new Appointment({
      patient: req.user.id,
      therapist: therapistId,
      date,
      startTime,
      endTime,
      type,
    });

    await newAppointment.save();

    // 👤 Eğer kullanıcının rolü hâlâ patient değilse güncelle
    if (user.role !== 'patient' && user.role !== 'therapist' && user.role !== 'admin') {
      user.role = 'patient';
      await user.save();
    }

    res.status(201).json({ message: 'Appointment request submitted.', appointment: newAppointment });
  } catch (error) {
    console.error('💥 Appointment Error!', error);
    res.status(500).json({ message: 'Server Error!' });
  }
});

router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (req.user.role !== 'therapist') {
      return res.status(403).json({ message: 'Only therapists can update appointment status.' });
    }

    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    if (appointment.therapist.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own appointments.' });
    }

    appointment.status = status;
    await appointment.save();

    res.status(200).json({ message: 'Appointment status updated.', appointment });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Server Error!' });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user.id;
    } else if (req.user.role === 'therapist') {
      query.therapist = req.user.id;
    } else {
      return res.status(403).json({ message: 'Only patients or therapists can access their appointments.' });
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'username email')
      .populate('therapist', 'username email')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    console.error('My appointments error: ', error);
    res.status(500).json({ message: 'Server Error!' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can cancel appointments.' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only cancel your own appointments.' });
    }

    const [hour, minute] = appointment.startTime.split(':');
    const appointmentDateTime = new Date(appointment.date);
    appointmentDateTime.setHours(parseInt(hour), parseInt(minute), 0, 0);

    const now = new Date();
    const diffInHours = (appointmentDateTime - now) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return res.status(400).json({ message: 'Appointments can only be cancelled at least 24 hours in advance.' });
    }

    await Appointment.deleteOne({ _id: id });

    res.status(200).json({ message: 'Appointment permanently deleted.' });
  } catch (error) {
    console.error("Permanent cancel error:", error);
    res.status(500).json({ message: 'Server Error!' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('therapist', 'username')
      .populate('patient', 'username');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const isPatient = appointment.patient._id.toString() === req.user.id;
    const isTherapist = appointment.therapist._id.toString() === req.user.id;

    if (!isPatient && !isTherapist) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({
      _id: appointment._id,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      type: appointment.type,
      status: appointment.status,
      price: appointment.price || 500,
      therapistName: appointment.therapist.username,
      patientName: appointment.patient.username,
      paymentStatus: appointment.paymentStatus || 'unpaid'
    });
  } catch (error) {
    console.error('Appointment fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
