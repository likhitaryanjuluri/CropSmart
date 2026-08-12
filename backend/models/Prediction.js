const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inputs: {
    nitrogen: Number, phosphorus: Number, potassium: Number,
    temperature: Number, humidity: Number, ph: Number, rainfall: Number,
    season: String, location: String
  },
  result: {
    topCrop: String,
    confidence: Number,
    topFive: [{ crop: String, confidence: Number }],
    soilHealthScore: Number,
    soilTips: [String],
    fertilizerRecommendation: {
      name: String, npkRatio: String,
      quantity: String, timing: String, notes: String
    }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prediction', predictionSchema);
