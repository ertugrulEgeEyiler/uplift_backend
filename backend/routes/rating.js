const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const Rating = require('../models/Rating');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const TherapistApplication = require('../models/TherapistApplication');

// Submit a rating for a completed appointment
router.post('/:appointmentId', authMiddleware, async (req, res) => {
 try {
    const { score, comment, categories, isAnonymous } = req.body;
    const appointmentId = req.params.appointmentId;
    const patientId = req.user.id;

    // Kategori değerlerini kontrol et
    if (!categories || 
        !categories.communication || categories.communication < 1 ||
        !categories.professionalism || categories.professionalism < 1 ||
        !categories.helpfulness || categories.helpfulness < 1 ||
        !categories.knowledge || categories.knowledge < 1) {
      return res.status(400).json({ 
        message: 'Tüm kategori değerleri en az 1 olmalıdır (iletişim, profesyonellik, yardımseverlik, bilgi)' 
      });
    }

    // Verify the appointment exists and belongs to this patient
    const appointment = await Appointment.findById(appointmentId)
      .populate('slot');
    const today = new Date();
    const slotDate = new Date(appointment.slot.date);
    const [hours, minutes] = appointment.slot.endTime.split(':').map(Number);
    slotDate.setHours(hours, minutes);

    if (slotDate > today) {
      return res.status(400).json({ message: 'You can only rate completed appointments' });
    }

    // Check if a rating already exists
    const existingRating = await Rating.findOne({ appointment: appointmentId });
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this appointment' });
    }

    // Create the rating
    const rating = new Rating({
      appointment: appointmentId,
      patient: patientId,
      therapist: appointment.therapist,
      score,
      comment,
      categories,
      isAnonymous
    });

    await rating.save();

    // Calculate new average rating for the therapist
    const therapistRatings = await Rating.find({ therapist: appointment.therapist });
    const totalScore = therapistRatings.reduce((sum, rating) => sum + rating.score, 0);
    const averageRating = totalScore / therapistRatings.length;

    // Update TherapistApplication with new average rating
    await TherapistApplication.findOneAndUpdate(
      { user: appointment.therapist, approved: true },
      { $set: { ratingAverage: averageRating, ratingCount: therapistRatings.length } }
    );

    res.status(201).json({ message: 'Rating submitted successfully', rating });
  } catch (error) {
    console.error('Rating submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get therapist's ratings
router.get('/therapist/:therapistId', async (req, res) => {
  try {
    const therapistId = req.params.therapistId;
    const ratings = await Rating.find({ therapist: therapistId })
      .populate('patient', 'username') // Only include non-sensitive user info
      .sort({ createdAt: -1 });

    // Process ratings to respect anonymity settings
    const processedRatings = ratings.map(rating => {
      if (rating.isAnonymous) {
        return {
          ...rating.toObject(),
          patient: { username: 'Anonymous' }
        };
      }
      return rating;
    });

    // Calculate average scores by category
    const categoryAverages = {
      communication: 0,
      professionalism: 0,
      helpfulness: 0,
      knowledge: 0
    };

    let validRatingsCount = 0;
    
    ratings.forEach(rating => {
      if (rating.categories) {
        validRatingsCount++;
        for (const [key, value] of Object.entries(rating.categories)) {
          if (value) categoryAverages[key] += value;
        }
      }
    });

    if (validRatingsCount > 0) {
      for (const key in categoryAverages) {
        categoryAverages[key] = categoryAverages[key] / validRatingsCount;
      }
    }

    // Calculate overall average
    const totalScore = ratings.reduce((sum, rating) => sum + rating.score, 0);
    const averageRating = ratings.length > 0 ? totalScore / ratings.length : 0;

    res.status(200).json({
      ratings: processedRatings,
      averageRating,
      ratingsCount: ratings.length,
      categoryAverages
    });
  } catch (error) {
    console.error('Get therapist ratings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get ratings for a patient (only their own)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const ratings = await Rating.find({ patient: req.user.id })
      .populate('therapist', 'username')
      .populate('appointment')
      .sort({ createdAt: -1 });

    res.status(200).json(ratings);
  } catch (error) {
    console.error('Get patient ratings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;