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
            certificateUrl,
        });

        await application.save();

        res.status(201).json({ message: 'Your application has been submitted successfully!' })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error!' });
    }
});

router.get('/list', async (req, res) => {
    try {
      const applications = await TherapistApplication.find({ approved: true }).populate('user');
      const formatted = applications.map(app => ({
        _id: app.user._id,
        username: app.user.username,
        specialization: app.specialization,
        languages: app.languages,
        location: app.location,
      }));
      res.status(200).json(formatted);
    } catch (err) {
      console.error('Therapist list fetch error:', err);
      res.status(500).json({ message: 'Server Error!' });
    }
  });
  

router.get('/profile/:id', async (req, res) => {
    try {
      const application = await TherapistApplication.findOne({ user: req.params.id, approved: true }).populate('user');
      if (!application) return res.status(404).json({ message: 'Therapist not found' });
  
      const combined = {
        ...application.user.toObject(),
        specialization: application.specialization,
        description: application.description,
        languages: application.languages,
        location: application.location,
      };
  
      res.status(200).json(combined);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const therapist = await TherapistApplication.findOne({ user: req.params.id, approved: true }).populate('user');
      if (!therapist) return res.status(404).json({ message: 'Therapist not found.' });
  
      res.status(200).json({
        id: therapist.user._id,
        username: therapist.user.username,
        email: therapist.user.email,
        location: therapist.location,
        languages: therapist.languages,
        specialization: therapist.specialization,
        description: therapist.user.bio || '',
      });
    } catch (err) {
      console.error('Therapist detail fetch error:', err);
      res.status(500).json({ message: 'Server Error!' });
    }
  });
  
module.exports = router;