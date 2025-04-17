const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const Availability = require('../models/Availability');

router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            date,
            startTime,
            endTime,
            isRecurring,
            recurrencePattern
        } = req.body;

        if (req.user.role !== 'therapist') {
            return res.status(403).json({ message: 'Only therapists can  set availability.' });
        }

        const newSlot = new Availability({
            therapist: req.user.id,
            date,
            startTime,
            endTime,
            isRecurring,
            recurrencePattern
        });

        await newSlot.save();

        res.status(201).json({ meesage: 'Availability added successfully.', slot: newSlot });
    } catch (error) {
        console.error('Availability Error: ', error);
        res.status(500).json({ message: 'Server Error!' })
    }
});

router.get('/:therapistId', async (req, res) => {
    try {
        const { therapistId } = req.params;
        const { date } = req.query;

        const query = {
            therapist: therapistId,
            isBlocked: false,
        };

        if (date) {
            query.date = new Date(date);
        };

        const slots = await Availability.find(query).sort({ date: 1, startTime: 1 });

        res.status(200).json(slots);
    } catch  (error) {
        console.error('Availability fetch error.', error);
        res.status(500).json({ messasge: 'Server Error!' });
    }
});

module.exports = router;