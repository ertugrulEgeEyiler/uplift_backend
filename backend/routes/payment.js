const express = require('express');
const router = express.Router();
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Appointment = require('../models/Appointment');

// Stripe ödeme intent oluşturma
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // kuruş cinsinden
      currency: 'try',
      payment_method_types: ['card'],
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Stripe Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Ödeme başarıyla tamamlandıktan sonra randevuyu isPaid:true yap
router.post('/confirm-payment', async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const updated = await Appointment.findByIdAndUpdate(
      appointmentId,
      { isPaid: true },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Appointment not found' });

    res.status(200).json({ message: 'Payment confirmed' });
  } catch (err) {
    console.error('Confirm payment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
