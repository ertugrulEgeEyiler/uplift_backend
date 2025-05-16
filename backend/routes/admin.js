const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');
const TherapistApplication = require('../models/TherapistApplication');
const User = require('../models/User');

// Admin route to get all applications with different statuses
router.get('/therapists-applications', authMiddleware, authorizeRoles('admin'), async (req, res) => {
    try {
        const applications = await TherapistApplication.find().populate('user', 'username email');
        res.status(200).json(applications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error!' });
    }
});

// Maintain the old route for backward compatibility
router.get('/therapists-pending', authMiddleware, authorizeRoles('admin'), async (req, res) => {
    try {
        const applications = await TherapistApplication.find({ approved: false, rejected: false }).populate('user', 'username email');
        res.status(200).json(applications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error!' });
    }
});

// Get approved applications
router.get('/therapists-approved', authMiddleware, authorizeRoles('admin'), async (req, res) => {
    try {
        const applications = await TherapistApplication.find({ approved: true }).populate('user', 'username email');
        res.status(200).json(applications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error!' });
    }
});

// Get rejected applications
router.get('/therapists-rejected', authMiddleware, authorizeRoles('admin'), async (req, res) => {
    try {
        const applications = await TherapistApplication.find({ rejected: true }).populate('user', 'username email');
        res.status(200).json(applications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error!' });
    }
});

// Approving applications
router.post('/therapists-approve/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
    try {
        const application = await TherapistApplication.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ message: 'Application not found.' })
        }

        application.approved = true;
        application.rejected = false;
        await application.save();

        const user = await User.findById(application.user);
        if (user) {
            user.role = 'therapist';
            await user.save();
        }

        res.status(200).json({ message: 'Therapist application approved successfully.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Rejecting applications
router.post('/therapists-reject/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
    try {
        const application = await TherapistApplication.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ message: 'Application not found.' })
        }

        if (application.approved) {
            return res.status(400).json({ message: 'Cannot reject an already approved application.' });
        }

        application.rejected = true;
        application.approved = false;
        await application.save();

        res.status(200).json({ message: 'Therapist application rejected successfully.' })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
})

module.exports = router;