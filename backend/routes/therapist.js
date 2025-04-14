const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const TherapistApplication = require('../models/TherapistApplication');

// Therapist application
router.post('/apply', authMiddleware, async (req, res) => {
    try {
        const { specialization, licenseNumber, description } = req.body;

        const existingApplication = await TherapistApplication.findOne({ user: req.user.id, approved: false, rejected: false });

        if (existingApplication) {
            return res.status(400).json({ message: 'You already have a pending application.' });
        }

        const application = new TherapistApplication({
            user: req.user.id,
            specialization,
            licenseNumber,
            description
        });

        await application.save();

        res.status(201).json({ message: 'Your application has been submitted successfully!' })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error!' });
    }
});

module.exports = router;