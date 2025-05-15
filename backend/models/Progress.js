const mongoose = require('mongoose');

const MoodSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  mood: { type: String, required: true },
  intensity: { type: Number, required: true }
});

const GoalSchema = new mongoose.Schema({
  description: { type: String, required: true },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false }
});

const ProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moods: [MoodSchema],
  goals: [GoalSchema]
}, { timestamps: true });

module.exports = mongoose.model('Progress', ProgressSchema);
