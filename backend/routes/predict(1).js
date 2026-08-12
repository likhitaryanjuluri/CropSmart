const router              = require('express').Router();
const fetch               = require('node-fetch');
const auth                = require('../middleware/authMiddleware');
const Prediction          = require('../models/Prediction');
const { fallbackPredict } = require('../utils/cropRules');
const fertilizerDB        = require('../utils/fertilizerDB');
const computeSoilHealth   = require('../utils/soilHealth');

const ML_API = process.env.ML_API || 'http://localhost:5001';

router.post('/', auth, async (req, res) => {
  try {
    const inputs = req.body;

    // Try ML model API — season is sent and encoded inside Flask
    let mlResult = null;
    try {
      const mlRes = await fetch(`${ML_API}/predict`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(inputs)
      });
      if (mlRes.ok) mlResult = await mlRes.json();
    } catch (mlErr) {
      console.warn('ML API unavailable, using rule-based fallback:', mlErr.message);
    }

    // Use ML result or fall back to rule-based
    const { topCrop, confidence, topFive } = mlResult?.topCrop
      ? mlResult
      : fallbackPredict(inputs);

    // Soil health + fertilizer always computed in Node
    const { score: soilHealthScore, tips: soilTips } = computeSoilHealth(inputs);
    const fertilizerRecommendation = fertilizerDB[topCrop] || {
      name: 'Balanced NPK', npkRatio: '10-10-10',
      quantity: '100 kg/acre', timing: 'At sowing',
      notes: 'Consult local agronomist.'
    };

    const result = { topCrop, confidence, topFive, soilHealthScore, soilTips, fertilizerRecommendation };
    const prediction = await Prediction.create({ userId: req.user.userId, inputs, result });
    res.json({ predictionId: prediction._id, ...result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
