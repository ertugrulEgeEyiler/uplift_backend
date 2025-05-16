// backend/routes/chat.js
// -------------------------------------------------------------
// DM sistemi - Hasta ↔︎ Terapist
// -------------------------------------------------------------
const express       = require('express');
const Conversation  = require('../models/Conversation');
const Message       = require('../models/Message');
const auth          = require('../middlewares/authMiddleware');
const { io }        = require('../socket');          // socket.io instance

const router = express.Router();

/* =============================================================
   YARDIMCI: Katılımcı dizisini sıralı döndür (duplicate fix)
   =========================================================== */
const normalizeMembers = (a, b) =>
  [a.toString(), b.toString()].sort();               // alfabe/ObjectId sıralı

/* =============================================================
   1)  GET /api/chat/conversations
       Kullanıcının tüm DM listesi
   =========================================================== */
router.get('/conversations', auth, async (req, res) => {
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

/* =============================================================
   2)  POST /api/chat/conversations
       Yeni DM aç (veya mevcutu döndür)
   =========================================================== */
router.post('/conversations', auth, async (req, res) => {
  try {
    const { partnerId } = req.body;

    if (!partnerId)           return res.status(400).json({ message:'partnerId required' });
    if (partnerId === req.user.id)
      return res.status(400).json({ message:'Cannot chat with yourself' });

    // Hasta-Terapist kontrolü burada yapılabilir (isteğe bağlı)

    const participants = normalizeMembers(req.user.id, partnerId);

    // 1) Var mı?
    let convo = await Conversation.findOne({ participants });
    if (convo) return res.json(convo);

    // 2) Yoksa oluştur (duplicate yarışına karşı try/catch)
    try {
      convo = await Conversation.create({ participants });
    } catch (err) {
      if (err.code === 11000)            // başka istek aynı anda yarattı
        convo = await Conversation.findOne({ participants });
      else throw err;
    }

    // Emit new-conversation event for real-time updates
    io.emit('new-conversation', convo);

    res.status(201).json(convo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =============================================================
   3)  GET /api/chat/:conversationId/messages
       Konuşmadaki tüm mesajlar
   =========================================================== */
router.get('/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const convo = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });
    if (!convo) return res.status(403).json({ message:'Access denied' });

    const messages = await Message
      .find({ conversation: conversationId })
      .sort('createdAt');

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message:'Server error' });
  }
});

/* =============================================================
   4)  POST /api/chat/:conversationId/messages
       Mesaj gönder + socket yayını
   =========================================================== */
router.post('/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text }           = req.body;

    if (!text?.trim()) return res.status(400).json({ message:'Text required' });

    const convo = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });
    if (!convo) return res.status(403).json({ message:'Access denied' });

    const msg = await Message.create({
      conversation: conversationId,
      sender:       req.user.id,
      text
    });

    // -------- real-time gönder --------
    // Ensure the message is sent to the correct room
    io.to(conversationId).emit('new-message', msg);

    res.status(201).json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message:'Server error' });
  }
});

/* ============================================================ */
module.exports = router;
