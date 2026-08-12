
// ─── VALID RANGES ─────────────────────────────────────────────────────────────
// These are the absolute min/max values possible in real-world agriculture.
// Anything outside these is considered extreme / impossible.

const VALID_RANGES = {
  nitrogen: {
    min: 10,
    max: 200,
    unit: 'mg/kg',
    label: 'Nitrogen (N)',
    hint: 'Nitrogen must be between 10 and 200 mg/kg. Below 10 means completely infertile soil. Above 200 causes toxic nitrogen burn — no crop can survive.'
  },
  phosphorus: {
    min: 5,
    max: 150,
    unit: 'mg/kg',
    label: 'Phosphorus (P)',
    hint: 'Phosphorus must be between 5 and 150 mg/kg. Below 5 means no root development is possible. Above 150 causes nutrient toxicity.'
  },
  potassium: {
    min: 5,
    max: 205,
    unit: 'mg/kg',
    label: 'Potassium (K)',
    hint: 'Potassium must be between 5 and 205 mg/kg. Below 5 means complete crop failure. Above 205 causes salt stress in soil.'
  },
  temperature: {
    min: 8,
    max: 45,
    unit: '°C',
    label: 'Temperature',
    hint: 'No crop can grow below 8°C (frost damage) or above 45°C (heat stress kills all crops).'
  },
  humidity: {
    min: 14,
    max: 99,
    unit: '%',
    label: 'Humidity',
    hint: 'Humidity must be between 14% and 99% for any crop to survive.'
  },
  ph: {
    min: 3.5,
    max: 9.5,
    unit: '',
    label: 'Soil pH',
    hint: 'Soil pH below 3.5 is toxic acid. Above 9.5 is extreme alkaline. No crop grows in these conditions.'
  },
  rainfall: {
    min: 0,
    max: 298,
    unit: 'mm',
    label: 'Rainfall',
    hint: 'Rainfall must be between 0mm and 298mm for any crop to survive. Below 20mm is extreme drought.'
  }
};

// ─── VALIDATE FUNCTION ────────────────────────────────────────────────────────
function validateInputs(inputs) {
  const errors = [];

  for (const [field, range] of Object.entries(VALID_RANGES)) {
    const value = parseFloat(inputs[field]);

    // Check if value exists
    if (inputs[field] === undefined || inputs[field] === null || inputs[field] === '') {
      errors.push({
        field,
        value: inputs[field],
        message: `${range.label} is required.`
      });
      continue;
    }

    // Check if value is a valid number
    if (isNaN(value)) {
      errors.push({
        field,
        value: inputs[field],
        message: `${range.label} must be a valid number.`
      });
      continue;
    }

    // Check if value is within valid range
    if (value < range.min || value > range.max) {
      errors.push({
        field,
        value,
        message: `${range.label} value of ${value} ${range.unit} is outside the valid range (${range.min}–${range.max} ${range.unit}). ${range.hint}`
      });
    }
  }

  // ─── COMBINATION CHECKS ───────────────────────────────────────────────────
  // Check for impossible combinations even if individual values are valid

  const temp     = parseFloat(inputs.temperature);
  const humidity = parseFloat(inputs.humidity);
  const rainfall = parseFloat(inputs.rainfall);
  const ph       = parseFloat(inputs.ph);
  const n        = parseFloat(inputs.nitrogen);
  const p        = parseFloat(inputs.phosphorus);
  const k        = parseFloat(inputs.potassium);

  // All NPK very low — completely barren soil
  if (n <= 10 && p <= 5 && k <= 5) {
    errors.push({
      field: 'combination',
      message: `Impossible combination: N(${n}), P(${p}), K(${k}) are all at bare minimum — this describes completely barren/dead soil where no crop can grow.`
    });
  }

  // Very high temp + very low humidity — desert conditions
  if (temp > 40 && humidity < 20) {
    errors.push({
      field: 'combination',
      message: `Impossible combination: Temperature ${temp}°C with Humidity ${humidity}% describes extreme desert conditions where no crop can survive.`
    });
  }

  // Very low temp + very high rainfall — frozen conditions
  if (temp < 8 && rainfall > 250) {
    errors.push({
      field: 'combination',
      message: `Impossible combination: Temperature ${temp}°C with Rainfall ${rainfall}mm describes frozen/glacial conditions where no crop can grow.`
    });
  }

  // Extremely high NPK all at once — chemically burnt soil
  if (n > 120 && p > 130 && k > 190) {
    errors.push({
      field: 'combination',
      message: `Impossible combination: Extremely high N(${n}), P(${p}), K(${k}) together indicate chemically burnt soil where no crop can survive.`
    });
  }

  // Extreme acid pH + high rainfall — heavily leached soil
  if (ph < 4.0 && rainfall > 250) {
    errors.push({
      field: 'combination',
      message: `Impossible combination: pH ${ph} with Rainfall ${rainfall}mm describes severely leached acidic soil — no crop can grow.`
    });
  }

  // Very high humidity + very low rainfall — contradictory
  if (humidity > 95 && rainfall === 0) {
    errors.push({
      field: 'combination',
      message: `Contradictory values: Humidity ${humidity}% with Rainfall ${rainfall}mm is not a realistic agricultural condition.`
    });
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors
    };
  }

  return { valid: true, errors: [] };
}

module.exports = { validateInputs, VALID_RANGES };
