const { Schema, model, Types } = require('mongoose');

const messageSchema = new Schema(
  {
    conversation: { type: Types.ObjectId, ref: 'Conversation', required: true },
    sender:       { type: Types.ObjectId, ref: 'User',         required: true },
    text:         { type: String,                              required: true },
    readBy:       [{ type: Types.ObjectId, ref: 'User' }]      // okundu bilgisi opsiyonel
  },
  { timestamps: true }
);

module.exports = model('Message', messageSchema);
