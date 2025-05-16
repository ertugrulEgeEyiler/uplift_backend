const { Schema, model, Types } = require('mongoose');

const conversationSchema = new Schema(
  {
    participants: [{
      type:  Types.ObjectId,
      ref:   'User',
      required: true
    }],
    /* 🆕 hash alanı */
    pairHash: { type: String, unique: true }   //  userId_userId
  },
  { timestamps: true }
);

// Her kayıttan önce hash üret
conversationSchema.pre('validate', function (next) {
  if (this.participants?.length === 2) {
    this.pairHash = this.participants
      .map(id => id.toString())
      .sort()                      // sıralar → {A,B} ve {B,A} aynı olur
      .join('_');                  // "A_B"
  }
  next();
});
module.exports = model('Conversation', conversationSchema);