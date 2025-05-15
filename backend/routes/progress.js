const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const Progress = require('../models/Progress');

// Get progress data for user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    let progress = await Progress.findOne({ user: req.user.id });
    
    // ✨ Eğer progress yoksa otomatik oluştur
    if (!progress) {
      progress = new Progress({ user: req.user.id });
      await progress.save();
    }

    res.status(200).json(progress);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update wellbeing score (weekly entry)
router.post('/wellbeing', authMiddleware, async (req, res) => {
  try {
    const { date, score } = req.body;

    let progress = await Progress.findOne({ user: req.user.id });
    if (!progress) {
      progress = new Progress({ user: req.user.id });
    }

    progress.wellbeingScores.push({ date, score });
    await progress.save();

    res.status(200).json({ message: 'Wellbeing score added', progress });
  } catch (error) {
    console.error('Update wellbeing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add or update a goal
router.post('/goals', authMiddleware, async (req, res) => {
  try {
    const { description } = req.body;

    let progress = await Progress.findOne({ user: req.user.id });
    if (!progress) {
      progress = new Progress({ user: req.user.id });
    }

    progress.goals.push({ description, progress: 0, completed: false });
    await progress.save();

    res.status(200).json({ message: 'Goal added', progress });
  } catch (error) {
    console.error('Add goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update goal progress
router.put('/goals/:goalId', authMiddleware, async (req, res) => {
  try {
    const { progressValue, completed } = req.body;

    const progress = await Progress.findOne({ user: req.user.id });
    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    const goal = progress.goals.id(req.params.goalId);
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    goal.progress = progressValue;
    if (completed !== undefined) {
      goal.completed = completed;
    }

    await progress.save();

    res.status(200).json({ message: 'Goal updated', progress });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/mood', authMiddleware, async (req, res) => {
  const { mood, intensity, date } = req.body;

  try {
    let progress = await Progress.findOne({ user: req.user.id });

    if (!progress) {
      // Progress yoksa direkt mood ile oluştur
      progress = new Progress({
        user: req.user.id,
        moods: [{ mood, intensity, date: new Date(date) }],
        goals: []
      });
    } else {
      // Varsa direkt mood ekle
      progress.moods.push({ mood, intensity, date: new Date(date) });
    }

    await progress.save();
    res.status(201).json({ message: 'Mood saved successfully!' });
  } catch (error) {
    console.error('Add mood error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});
// Get full progress data
router.get('/', authMiddleware, async (req, res) => {
  try {
    const progress = await Progress.findOne({ user: req.user.id });
    if (!progress) {
      return res.status(404).json({ message: 'No progress data found.' });
    }
    res.status(200).json(progress);
  } catch (error) {
    console.error('Fetch progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new goal
router.post('/goal', authMiddleware, async (req, res) => {
  try {
    const { description } = req.body;

    let progress = await Progress.findOne({ user: req.user.id });
    if (!progress) {
      progress = new Progress({ user: req.user.id });
    }

    progress.goals.push({ description, progress: 0, completed: false });
    await progress.save();

    res.status(200).json({ message: 'Goal added', progress });
  } catch (error) {
    console.error('Add goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update goal progress
router.put('/goal/:goalId', authMiddleware, async (req, res) => {
  try {
    const { progressValue, completed } = req.body;

    const progress = await Progress.findOne({ user: req.user.id });
    if (!progress) return res.status(404).json({ message: 'Progress not found.' });

    const goal = progress.goals.id(req.params.goalId);
    if (!goal) return res.status(404).json({ message: 'Goal not found.' });

    goal.progress = progressValue ?? goal.progress;
    if (completed !== undefined) goal.completed = completed;

    await progress.save();
    res.status(200).json({ message: 'Goal updated.', goal });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
