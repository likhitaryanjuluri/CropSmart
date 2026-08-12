function computeSoilHealth(inputs) {
  let score = 100;
  const tips = [];

  if (inputs.ph < 5.5)            { score -= 20; tips.push('Soil is too acidic. Apply agricultural lime to raise pH above 6.0.'); }
  else if (inputs.ph > 8.0)       { score -= 20; tips.push('Soil is too alkaline. Apply sulfur or gypsum to lower pH.'); }
  else if (inputs.ph < 6.0)       { score -= 8;  tips.push('Slightly acidic — consider light lime application.'); }
  else if (inputs.ph > 7.5)       { score -= 8;  tips.push('Slightly alkaline — monitor micronutrient availability.'); }

  if (inputs.nitrogen < 20)       { score -= 15; tips.push('Nitrogen deficiency — add urea or compost to boost N levels.'); }
  else if (inputs.nitrogen > 140) { score -= 10; tips.push('Excess nitrogen — reduce N fertilizer to prevent leaching.'); }

  if (inputs.phosphorus < 10)     { score -= 12; tips.push('Low phosphorus — apply DAP or SSP for root development.'); }
  if (inputs.potassium < 10)      { score -= 12; tips.push('Potassium deficiency — apply MOP or wood ash.'); }

  if (inputs.humidity < 30)       { score -= 10; tips.push('Low humidity — consider irrigation or mulching.'); }
  else if (inputs.humidity > 90)  { score -= 8;  tips.push('Very high humidity — increases fungal disease risk.'); }

  if (inputs.rainfall < 20)       { score -= 10; tips.push('Very low rainfall — irrigation is essential.'); }
  else if (inputs.rainfall > 300) { score -= 8;  tips.push('Heavy rainfall — ensure drainage to prevent waterlogging.'); }

  if (tips.length === 0) tips.push('Excellent soil conditions! Maintain organic matter with annual compost application.');

  return { score: Math.max(0, Math.min(100, score)), tips };
}

module.exports = computeSoilHealth;
