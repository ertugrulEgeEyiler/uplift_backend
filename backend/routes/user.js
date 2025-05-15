const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Update user profile
router.put('/update-profile', authMiddleware, async (req, res) => {
  try {
    const updates = { ...req.body };
    const userId = req.user.id;

    // Make sure we're not trying to update sensitive fields
    delete updates.password;
    delete updates.email;
    delete updates.role;
    delete updates.isVerified;
    delete updates.verificationToken;

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password -verificationToken');

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        age: updatedUser.age,
        gender: updatedUser.gender,
        description: updatedUser.description,
        location: updatedUser.location,
        phone: updatedUser.phone
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error!' });
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new passwords are required' });
    }
    
    // Get user with password
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error!' });
  }
});

// Delete account (soft delete)
router.delete('/delete-account', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // In a real app, you might want to implement soft delete instead of actual deletion
    // This would involve setting a 'deleted' flag and anonymizing the data instead of removing
    // For now, we'll just delete the user
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error!' });
  }
});

// Update notification preferences
router.put('/notification-preferences', authMiddleware, async (req, res) => {
  try {
    const { notifications } = req.body;
    const userId = req.user.id;
    
    // Add notification preferences to the user model
    // This assumes you've added a notificationPreferences field to your User model
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { notificationPreferences: notifications },
      { new: true }
    );
    
    res.status(200).json({ 
      message: 'Notification preferences updated successfully',
      notificationPreferences: updatedUser.notificationPreferences
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error!' });
  }
});

module.exports = router;