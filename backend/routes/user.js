const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Profile Update
router.put('/update-profile', authMiddleware, async (req, res) => {
  try {
    const updates = { ...req.body };
    const userId = req.user.id;

    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(updates.password, salt);
      updates.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        age: updatedUser.age,
        gender: updatedUser.gender,
        languages: updatedUser.languages,
        description: updatedUser.description,
        location: updatedUser.location,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error!' });
  }
});

// Get Current User
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      id: user._id,
      username: user.username,   // 🔥 Burada artık "username" doğru dönecek
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      age: user.age,
      gender: user.gender,
      phone: user.phone,
      description: user.description,
      location: user.location,
      languages: user.languages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});
router.put('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});




// ---------------Burayı İncele Ertuğ-------------------
// backend/routes/user.js dosyasına ekleyiniz
// Belirli bir kullanıcının profil bilgilerini getir
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -verificationToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error!' });
  }
});

// Kullanıcı detaylarını ve ilişkili verileri getir
router.get('/:id/details', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('-password -verificationToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Kullanıcının rolüne göre ek bilgileri getir
    let additionalData = {};
    
    if (user.role === 'patient') {
      // Hasta için randevuları, kaydedilen terapistleri vs. getir
      // Bu bölüm projenizin ihtiyaçlarına göre özelleştirilebilir
    } 
    else if (user.role === 'therapist') {
      // Terapist için profil bilgilerini, değerlendirmeleri vs. getir
      const therapistDetails = await TherapistApplication.findOne({ user: userId, approved: true });
      additionalData = { therapistDetails };
    }
    
    res.status(200).json({
      user,
      ...additionalData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error!' });
  }
});

module.exports = router;
