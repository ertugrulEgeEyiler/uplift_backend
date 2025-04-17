const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const Appointment = require('../models/Appointment');
const Availability = require('../models/Availability');

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

        if (req.user.role !== 'patient') {
            return res.status(403).json({ message: 'Only patients can book appointments.' });
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

        console.log('🔎 Availability bulunan:', availableSlot);

        if (!availableSlot) {
            return res.status(400).json({ message: 'Selected time slot is busy.' });
        }

        // ❌ Çakışma kontrolü (iptal olmayan başka randevu varsa)
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

        console.log('⛔ Çakışma:', conflict);

        if (conflict) {
            return res.status(409).json({ message: 'This time slot is already booked.' });
        }

        const newAppointment = new Appointment({
            patient: req.user.id,
            therapist: therapistId,
            date,
            startTime,
            endTime,
            type,
        });

        await newAppointment.save();

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

router.put('/:id/cancel', authMiddleware, async (req, res) => {
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

        const appointmentDateTime = new Date(`${appointment.date.toISOString().split('T')[0]}T${appointment.startTime}:00`);
        const now = new Date();

        const hoursDiff = (appointmentDateTime - now) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
            return res.status(400).json({ message: 'Appointments can only be cancelled at least 24 hours in advance.' });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        res.status(200).json({ message: 'Appointment cancelled successfully.', appointment });
    } catch (error) {
        console.error("Cancel error:", error);
        res.status(500).json({ message: 'Server Error!' });
    }
});

module.exports = router;
