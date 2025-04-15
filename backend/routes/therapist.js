const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const TherapistApplication = require('../models/TherapistApplication');
const upload = require('../middlewares/upload');
const User = require('../models/User');


// Therapist application
router.post('/apply', upload.single('certificate'), authMiddleware, async (req, res) => {
    try {
        const {
            age,
            gender,
            specialization,
            languages,
            licenseNumber,
            description,
            city,
            country,
            sessionCost,
        } = req.body;

        const certificateUrl = req.file ? req.file.filename : null;
        
        const existingUser = await User.findById(req.user.id);
        
        const existingApplication = await TherapistApplication.findOne({ user: req.user.id, approved: false, rejected: false });

        if (existingApplication) {
            return res.status(400).json({ message: 'You already have a pending application.' });
        }

        const application = new TherapistApplication({
            user: req.user.id,
            age: existingUser.age || req.body.age,
            gender: existingUser.gender || req.body.gender,
            specialization: specialization.split(','),
            languages: existingUser.languages,
            licenseNumber,
            description: existingUser.description || req.body.description,
            location: existingUser.location || {
                city: req.body.city,
                country: req.body.country,
            },
            sessionCost,
            certificateUrl,
        });

        await application.save();

        res.status(201).json({ message: 'Your application has been submitted successfully!' })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error!' });
    }
});

module.exports = router;