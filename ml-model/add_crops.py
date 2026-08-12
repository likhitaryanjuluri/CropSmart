import numpy as np
import pandas as pd

np.random.seed(42)

new_crops = {
    'wheat': {
        'N':(60,120), 'P':(35,60), 'K':(35,60),
        'temperature':(10,25), 'humidity':(45,75),
        'ph':(6.0,7.5), 'rainfall':(50,150)
    },
    'sugarcane': {
        'N':(100,200), 'P':(35,75), 'K':(35,75),
        'temperature':(22,38), 'humidity':(65,85),
        'ph':(6.0,7.5), 'rainfall':(100,250)
    },
    'mustard': {
        'N':(40,90), 'P':(30,60), 'K':(20,50),
        'temperature':(10,25), 'humidity':(40,70),
        'ph':(6.0,7.5), 'rainfall':(30,100)
    },
    'barley': {
        'N':(40,90), 'P':(25,55), 'K':(20,50),
        'temperature':(8,24), 'humidity':(40,70),
        'ph':(6.0,7.5), 'rainfall':(30,100)
    },
}

rows = []
SAMPLES = 100

for crop, ranges in new_crops.items():
    for _ in range(SAMPLES):
        rows.append({
            'N':           round(np.random.uniform(ranges['N'][0],           ranges['N'][1]),           2),
            'P':           round(np.random.uniform(ranges['P'][0],           ranges['P'][1]),           2),
            'K':           round(np.random.uniform(ranges['K'][0],           ranges['K'][1]),           2),
            'temperature': round(np.random.uniform(ranges['temperature'][0], ranges['temperature'][1]), 2),
            'humidity':    round(np.random.uniform(ranges['humidity'][0],    ranges['humidity'][1]),    2),
            'ph':          round(np.random.uniform(ranges['ph'][0],          ranges['ph'][1]),          2),
            'rainfall':    round(np.random.uniform(ranges['rainfall'][0],    ranges['rainfall'][1]),    2),
            'label':       crop
        })

# Load existing dataset and append
existing = pd.read_csv('Crop_recommendation.csv')
new_df   = pd.DataFrame(rows)
combined = pd.concat([existing, new_df], ignore_index=True)
combined = combined.sample(frac=1, random_state=42).reset_index(drop=True)
combined.to_csv('Crop_recommendation.csv', index=False)

print(f"Done! Total rows: {len(combined)}")
print(f"Crops now: {sorted(combined['label'].unique())}")
print(f"Samples per new crop:")
for crop in new_crops:
    print(f"  {crop}: {len(combined[combined['label']==crop])}")