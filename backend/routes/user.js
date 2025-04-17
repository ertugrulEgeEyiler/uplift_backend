const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const User = require('../models/User');

router.put('/update-profile', authMiddleware, async (req, res) => {
    try {
        const updates = req.body;
        const userId = req.user.id;

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
                description: updatedUser.bio,
                location: updatedUser.location,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error!' });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({
            id: user._id,
            name: user.username,
            role: user.role,
            email: user.email,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;