const router     = require('express').Router();
const auth       = require('../middleware/authMiddleware');
const Prediction = require('../models/Prediction');

// Get all predictions for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const history = await Prediction
      .find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(history);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete a specific prediction
router.delete('/:id', auth, async (req, res) => {
  try {
    await Prediction.deleteOne({ _id: req.params.id, userId: req.user.userId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
