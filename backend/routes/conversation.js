const express       = require('express');
const Conversation  = require('../models/Conversation');
const auth          = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * GET /api/conversations
 * Kullanıcının tüm konuşmaları
 */
router.get('/', auth, async (req, res) => {
  try {
    const convos = await Conversation
      .find({ participants: req.user.id })
      .populate('participants', 'username role');
    res.json(convos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/conversations
 * Hasta – terapist DM aç / mevcutu getir
 */
router.post('/', auth, async (req, res) => {
  try {
    const { partnerId } = req.body;
    if (!partnerId) return res.status(400).json({ message: 'partnerId required' });
    if (partnerId === req.user.id) return res.status(400).json({ message: 'Self DM yok' });

    const members = [req.user.id, partnerId].sort();          // her ikisinin id’si
    let convo = await Conversation.findOne({ participants: members });

    if (!convo) {
      convo = await Conversation.create({ participants: members });
    }
    res.json(convo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
