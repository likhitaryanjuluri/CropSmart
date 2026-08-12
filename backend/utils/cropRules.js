const cropRules = {
  rice:        { N:[60,120], P:[30,60],  K:[30,60],  temp:[20,35], humidity:[70,90], ph:[5.5,7.0], rainfall:[150,300], season:['kharif'] },
  wheat:       { N:[60,120], P:[30,60],  K:[30,60],  temp:[10,25], humidity:[50,75], ph:[6.0,7.5], rainfall:[50,150],  season:['rabi'] },
  maize:       { N:[60,120], P:[40,80],  K:[40,80],  temp:[18,35], humidity:[55,80], ph:[5.5,7.5], rainfall:[60,200],  season:['kharif','rabi'] },
  chickpea:    { N:[20,60],  P:[40,80],  K:[20,40],  temp:[15,30], humidity:[40,65], ph:[6.0,8.0], rainfall:[30,100],  season:['rabi'] },
  kidneybeans: { N:[20,60],  P:[60,120], K:[15,30],  temp:[15,30], humidity:[50,70], ph:[5.5,7.0], rainfall:[80,200],  season:['kharif'] },
  pigeonpeas:  { N:[10,40],  P:[60,100], K:[20,40],  temp:[20,35], humidity:[40,70], ph:[5.5,7.0], rainfall:[60,200],  season:['kharif'] },
  mothbeans:   { N:[10,30],  P:[30,60],  K:[15,30],  temp:[25,40], humidity:[30,55], ph:[6.0,8.0], rainfall:[20,80],   season:['kharif'] },
  mungbean:    { N:[20,40],  P:[40,80],  K:[20,40],  temp:[25,35], humidity:[55,75], ph:[6.0,7.5], rainfall:[50,150],  season:['kharif','zaid'] },
  blackgram:   { N:[20,40],  P:[40,80],  K:[15,30],  temp:[25,35], humidity:[55,75], ph:[6.0,7.5], rainfall:[60,150],  season:['kharif'] },
  lentil:      { N:[10,30],  P:[40,80],  K:[15,30],  temp:[15,25], humidity:[50,70], ph:[6.0,8.0], rainfall:[30,100],  season:['rabi'] },
  pomegranate: { N:[15,30],  P:[10,20],  K:[15,30],  temp:[20,38], humidity:[35,55], ph:[5.5,7.5], rainfall:[20,80],   season:['kharif','rabi'] },
  banana:      { N:[80,150], P:[40,80],  K:[40,80],  temp:[22,35], humidity:[70,90], ph:[5.5,7.0], rainfall:[100,300], season:['kharif','rabi'] },
  mango:       { N:[10,30],  P:[10,20],  K:[10,20],  temp:[24,38], humidity:[45,65], ph:[5.5,7.5], rainfall:[50,200],  season:['zaid'] },
  grapes:      { N:[15,30],  P:[10,20],  K:[10,20],  temp:[15,35], humidity:[50,75], ph:[5.5,7.0], rainfall:[30,100],  season:['rabi'] },
  watermelon:  { N:[80,120], P:[30,60],  K:[40,80],  temp:[25,38], humidity:[60,80], ph:[6.0,7.5], rainfall:[30,100],  season:['zaid'] },
  muskmelon:   { N:[80,120], P:[30,60],  K:[40,80],  temp:[25,38], humidity:[60,80], ph:[6.0,7.5], rainfall:[20,80],   season:['zaid'] },
  apple:       { N:[20,40],  P:[10,20],  K:[15,30],  temp:[5,22],  humidity:[50,75], ph:[5.5,6.5], rainfall:[50,150],  season:['rabi'] },
  orange:      { N:[15,30],  P:[10,20],  K:[10,20],  temp:[18,35], humidity:[50,75], ph:[5.5,7.5], rainfall:[50,150],  season:['rabi'] },
  papaya:      { N:[40,80],  P:[10,20],  K:[30,60],  temp:[22,38], humidity:[60,80], ph:[6.0,7.5], rainfall:[100,200], season:['kharif','zaid'] },
  coconut:     { N:[10,20],  P:[10,20],  K:[30,60],  temp:[22,37], humidity:[65,85], ph:[5.5,8.0], rainfall:[100,300], season:['kharif','rabi'] },
  cotton:      { N:[80,140], P:[30,60],  K:[15,30],  temp:[22,35], humidity:[55,80], ph:[6.0,8.0], rainfall:[60,200],  season:['kharif'] },
  jute:        { N:[60,100], P:[30,60],  K:[30,60],  temp:[24,37], humidity:[70,90], ph:[6.0,7.5], rainfall:[150,300], season:['kharif'] },
  coffee:      { N:[80,120], P:[20,40],  K:[20,40],  temp:[18,28], humidity:[65,85], ph:[6.0,6.5], rainfall:[100,300], season:['kharif'] },
  sugarcane:   { N:[100,200],P:[35,75],  K:[35,75],  temp:[22,38], humidity:[65,85], ph:[6.0,7.5], rainfall:[100,250], season:['kharif'] },
  mustard:     { N:[40,90],  P:[30,60],  K:[20,50],  temp:[10,25], humidity:[40,70], ph:[6.0,7.5], rainfall:[30,100],  season:['rabi'] },
  barley:      { N:[40,90],  P:[25,55],  K:[20,50],  temp:[8,24],  humidity:[40,70], ph:[6.0,7.5], rainfall:[30,100],  season:['rabi'] },
};

function scoreCrop(inputs, rules) {
  const checks = [
    { key: 'N',        val: inputs.nitrogen    },
    { key: 'P',        val: inputs.phosphorus  },
    { key: 'K',        val: inputs.potassium   },
    { key: 'temp',     val: inputs.temperature },
    { key: 'humidity', val: inputs.humidity    },
    { key: 'ph',       val: inputs.ph          },
    { key: 'rainfall', val: inputs.rainfall    },
  ];
  let total = 0;
  checks.forEach(({ key, val }) => {
    const [min, max] = rules[key];
    const mid  = (min + max) / 2;
    const half = (max - min) / 2 || 1;
    if (val >= min && val <= max) {
      total += 1 - (Math.abs(val - mid) / half) * 0.3;
    } else {
      const dist = val < min ? min - val : val - max;
      total += Math.max(0, 1 - dist / half);
    }
  });
  if (inputs.season && rules.season.includes(inputs.season.toLowerCase())) total += 0.5;
  return total / checks.length;
}

function fallbackPredict(inputs) {
  const scores = Object.entries(cropRules)
    .map(([crop, rules]) => ({ crop, score: scoreCrop(inputs, rules) }))
    .sort((a, b) => b.score - a.score);
  const maxScore = scores[0].score;
  const topFive = scores.slice(0, 5).map(({ crop, score }) => ({
    crop, confidence: Math.round((score / maxScore) * 100)
  }));
  return { topCrop: topFive[0].crop, confidence: topFive[0].confidence, topFive };
}

module.exports = { cropRules, scoreCrop, fallbackPredict };
