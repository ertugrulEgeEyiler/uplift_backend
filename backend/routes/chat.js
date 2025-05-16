const express      = require('express');
const Conversation = require('../models/Conversation');
const Message      = require('../models/Message');
const User         = require('../models/User');
const auth = require('../middlewares/authMiddleware');

const router = express.Router();


router.get('/conversations', auth, async (req, res) => {
  const convos = await Conversation.find({ participants: req.user.id })
                                   .populate('participants', 'username role');
  res.json(convos);
});


router.post('/conversations', auth, async (req, res) => {
  const { partnerId } = req.body;

  if (!partnerId) return res.status(400).json({ message: 'partnerId is required' });
  if (partnerId === req.user.id) return res.status(400).json({ message: 'Self chat not allowed' });

  const me       = await User.findById(req.user.id);
  const partner  = await User.findById(partnerId);
  if (!me || !partner) return res.status(404).json({ message: 'User not found' });

  const roles = [me.role, partner.role].sort().join('-');
  if (roles !== 'patient-therapist') {
    return res.status(400).json({ message: 'Chat only allowed between patient and therapist' });
  }

  const members   = [req.user.id, partnerId].sort();
  let conversation = await Conversation.findOne({ participants: members });

  if (!conversation) {
    conversation = await Conversation.create({ participants: members });
  }

  res.json(conversation);
});

router.get('/:conversationId/messages', auth, async (req, res) => {
  const { conversationId } = req.params;

  const convo = await Conversation.findOne({
    _id: conversationId,
    participants: req.user.id
  });
  if (!convo) return res.status(403).json({ message: 'Access denied' });

  const msgs = await Message.find({ conversation: conversationId }).sort('createdAt');
  res.json(msgs);
});

router.post('/:conversationId/messages', auth, async (req, res) => {
  const { conversationId } = req.params;
  const { text }           = req.body;

  if (!text?.trim()) return res.status(400).json({ message: 'Text is required' });

  const convo = await Conversation.findOne({
    _id: conversationId,
    participants: req.user.id
  });
  if (!convo) return res.status(403).json({ message: 'Access denied' });

  const msg = await Message.create({
    conversation: conversationId,
    sender:       req.user.id,
    text
  });

  res.status(201).json(msg);
});

module.exports = router;
