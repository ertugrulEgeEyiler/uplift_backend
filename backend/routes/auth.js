const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { error } = require('console');
const bcyrpt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cyrpto = require('crypto');
const authMiddleware = require('../middlewares/authMiddleware')
const authorizeRoles = require('../middlewares/authorizeRoles');

// User registration
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Hash password.
        const salt = await bcyrpt.genSalt(10);
        const hashedPassword = await bcyrpt.hash(password, salt);

        // Create email verification token.
        const verificationToken = cyrpto.randomBytes(32).toString('hex');

        // Create new user.
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            verificationToken,
        });

        // Save user.
        await newUser.save();

        // Send email.
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'upliftmailservice@gmail.com',
                pass: 'usgj tigk wheb ughg',
            },
        });

        const verifyUrl = `http://localhost:5000/api/auth/verify?token=${verificationToken}`;

        await transporter.sendMail({
            from: '"Uplift Support" <seninmail@gmail.com>',
            to: email,
            subject: 'Verify Your Email',
            html: `<h1>Verify Your Email</h1><p>Click the link to verify your email:</p><a href="${verifyUrl}">${verifyUrl}</a>`,
        });

        res.status(201).json({ message: 'User has been created.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error!' });
    }
});

// User login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user existence.
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' })
        }

        // Control if the user verified.
        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email before logging in.' });
        }

        // Control password.
        const isMatch = await bcyrpt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password.' })
        }

        //Create token.
        const token = jwt.sign(
            { id: user._id, role: user.role },
            "jwt_secret_key",
            { expiresIn: "1d" }
        );

        res.status(200).json({ token, user: { id: user._id, username: user.username, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error!' })
    }
});

// User verification.
router.get('/verify', async (req, res) => {
    try {
        const { token } = req.query;
        
        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ message: 'Invalid token.' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({ message: 'E-mail verified successfully.' })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error!' })
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if(!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Create reset token.
        const resetToken = cyrpto.randomBytes(32).toString('hex');
        user.verificationToken = resetToken;
        await user.save();

        // Send email for reset token link.
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'upliftmailservice@gmail.com',
              pass: 'usgj tigk wheb ughg',
            },
          });

          const resetUrl = `http://localhost:5000/reset-password?token=${resetToken}`;

          await transporter.sendMail({
            from: '"Uplift Support" <seninmail@gmail.com>',
            to: email,
            subject: 'Reset Your Password',
            html: `<h1>Reset Your Password</h1><p>Click the link below to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`,
          });

          res.status(200).json({ message: 'Password reset email sent!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error!' })
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await User.findOne({ verificationToken: token });

        if(!user) {
            return res.status(404).json({ message: 'Invalid or expired token.' });
        }

        // Hash the new password.
        const salt = await bcyrpt.genSalt(10);
        const hashedPassword = await bcyrpt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset is successful.' })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error!' })
    }
})

// Token authentication for restricted usage of app
router.get('/protected', authMiddleware, (req, res) => {
    res.status(200).json({ message: `Welcome, user ${req.user.id}` })
});

// Protected role route for testing
router.get('/only-patient', authMiddleware, authorizeRoles('patient'), (req, res) => {
    res.status(200).json({ message: `Welcome patient ${req.user.id}` });
})

module.exports = router;