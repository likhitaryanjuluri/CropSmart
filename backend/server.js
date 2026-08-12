require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const weatherRoutes = require("./routes/weather");

const app = express();
app.use(express.json());
app.use(cors());



// ─── DATABASE ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => { 
    console.log('✅ MongoDB connected',mongoose.connection.name);
    console.log("URI:", process.env.MONGO_URI);})
  .catch(err => console.error('❌ MongoDB error:', err));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/predict', require('./routes/predict'));
app.use('/api/history', require('./routes/history'));
app.use("/api/weather", weatherRoutes);


// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌱 CropSmart API running on port ${PORT}`));
