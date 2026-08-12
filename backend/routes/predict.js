const router              = require('express').Router();
const fetch               = require('node-fetch');
const auth                = require('../middleware/authMiddleware');
const Prediction          = require('../models/Prediction');
const { fallbackPredict } = require('../utils/cropRules');
const fertilizerDB        = require('../utils/fertilizerDB');
const computeSoilHealth   = require('../utils/soilHealth');
const { validateInputs }  = require('../utils/validateInputs');

const ML_API = 'http://localhost:5001';

// ─── SHARED PREDICTION LOGIC ─────────────────────────────────────────────────
async function runPrediction(inputs) {
  // ── VALIDATE INPUTS FIRST ──────────────────────────────────────────────────
  const validation = validateInputs(inputs);
  if (!validation.valid) {
    const error = new Error('VALIDATION_ERROR');
    error.validationErrors = validation.errors;
    throw error;
  }

  // Try ML model API first
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

  const { topCrop, confidence, topFive } = mlResult?.topCrop
    ? mlResult
    : fallbackPredict(inputs);

  const { score: soilHealthScore, tips: soilTips } = computeSoilHealth(inputs);
  const fertilizerRecommendation = fertilizerDB[topCrop] || {
    name: 'Balanced NPK', npkRatio: '10-10-10',
    quantity: '100 kg/acre', timing: 'At sowing',
    notes: 'Consult local agronomist.'
  };

  return { topCrop, confidence, topFive, soilHealthScore, soilTips, fertilizerRecommendation };
}

// ─── AUTHENTICATED PREDICT (saves to DB) ─────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const inputs = req.body;
    const result = await runPrediction(inputs);
    const prediction = await Prediction.create({ userId: req.user.userId, inputs, result });
    res.json({ predictionId: prediction._id, ...result });
  } catch (err) {
    if (err.message === 'VALIDATION_ERROR') {
      return res.status(422).json({
        error: 'Invalid input values detected',
        validationErrors: err.validationErrors
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── GUEST PREDICT (no auth, no DB save) ─────────────────────────────────────
router.post('/guest', async (req, res) => {
  try {
    const inputs = req.body;
    const result = await runPrediction(inputs);
    res.json({ guest: true, ...result });
  } catch (err) {
    if (err.message === 'VALIDATION_ERROR') {
      return res.status(422).json({
        error: 'Invalid input values detected',
        validationErrors: err.validationErrors
      });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
