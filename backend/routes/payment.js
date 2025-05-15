const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const Slot = require('../models/Slot');
const Appointment = require('../models/Appointment');
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe checkout session for slot booking
router.post('/book/:slotId', authMiddleware, async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.slotId);
    if (!slot || slot.status !== 'available') {
      return res.status(404).json({ message: 'Slot not available' });
    }

    if (slot.therapist.toString() === req.user.id) {
      return res.status(403).json({ message: 'You cannot book your own slot' });
    }

    const existingCount = await Appointment.countDocuments({ slot: slot._id, status: 'booked' });
    if (existingCount >= slot.maxParticipants) {
      return res.status(400).json({ message: 'Slot is already full' });
    }

    const alreadyBooked = await Appointment.findOne({
      slot: slot._id,
      patient: req.user.id,
      status: 'booked'
    });
    if (alreadyBooked) {
      return res.status(400).json({ message: 'You have already booked this slot' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Therapy session with ${slot.type}`,
            },
            unit_amount: slot.price * 100
          },
          quantity: 1
        }
      ],
      success_url: process.env.CLIENT_URL + `/payment-success?session_id={CHECKOUT_SESSION_ID}&slotId=` + slot._id,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      metadata: {
        slotId: slot._id.toString(),
        therapistId: slot.therapist.toString(),
        patientId: req.user.id
      }
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Confirm booking after successful payment
router.post('/confirm', authMiddleware, async (req, res) => {
  try {
    const { slotId, sessionId } = req.body;

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not confirmed.' });
    }

    const paymentIntentId = session.payment_intent;
    if (!paymentIntentId) {
      return res.status(400).json({ message: 'PaymentIntent not found in session.' });
    }

    const slot = await Slot.findById(slotId);
    if (!slot || slot.status !== 'available') {
      return res.status(404).json({ message: 'Slot not available' });
    }

    const currentCount = await Appointment.countDocuments({ slot: slot._id, status: 'booked' });
    if (currentCount >= slot.maxParticipants) {
      return res.status(400).json({ message: 'Slot is full' });
    }

    const jitsiRoom = `uplift_${slot._id}_${Date.now()}`;

    const appointment = new Appointment({
      slot: slot._id,
      therapist: slot.therapist,
      patient: req.user.id,
      isPaid: true,
      status: 'booked',
      paymentIntentId: paymentIntentId,
      jitsiRoom: jitsiRoom
    });

    await appointment.save();

    res.status(201).json({ message: 'Appointment booked successfully', appointment, jitsiLink: `https://meet.jit.si/${jitsiRoom}`, isBookable: currentCount + 1 < slot.maxParticipants  });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/refund/:appointmentId', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId).populate('slot');
    if (!appointment || appointment.status !== 'booked') {
      return res.status(400).json({ message: 'Appointment not found or not refundable' });
    }

    const slot = appointment.slot;
    const now = new Date();
    const slotDateTime = new Date(`${slot.date.toISOString().split('T')[0]}T${slot.startTime}:00`);
    const hoursBefore = (slotDateTime - now) / (1000 * 60 * 60);

    const isPatient = appointment.patient.toString() === req.user.id;
    const isTherapist = appointment.therapist.toString() === req.user.id;

    if (!isPatient && !isTherapist) {
      return res.status(403).json({ message: 'You are not authorized to cancel this appointment' });
    }

    if (isPatient && hoursBefore < 48) {
      return res.status(403).json({ message: 'Patients can only cancel at least 48h in advance' });
    }

    const refund = await stripe.refunds.create({
      payment_intent: appointment.paymentIntentId
    });

    appointment.status = 'refunded';
    await appointment.save();

    const bookedCount = await Appointment.countDocuments({ slot: slot._id, status: 'booked' });
    const isBookable = bookedCount < slot.maxParticipants;

    res.status(200).json({ message: 'Appointment refunded and cancelled', refund, isBookable });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ message: 'Refund failed' });
  }
});

module.exports = router;