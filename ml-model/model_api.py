"""
CropSmart Model API — Flask server
Run: python model_api.py
Port: 5001

Trained on : Crop_recommendation.csv (11,566 samples, 22 crops)
Algorithm  : Random Forest (200 trees, 99% test accuracy)
Features   : N, P, K, temperature, humidity, ph, rainfall, season_encoded
Season     : kharif=0, rabi=1, zaid=2

Request body (JSON):
  {
    "nitrogen":    90,
    "phosphorus":  42,
    "potassium":   43,
    "temperature": 20.8,
    "humidity":    82.0,
    "ph":          6.5,
    "rainfall":    202.9,
    "season":      "kharif"   (optional, defaults to "kharif")
  }
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

MODEL_FILE = 'crop_model.pkl'

if not os.path.exists(MODEL_FILE):
    print(f"ERROR: '{MODEL_FILE}' not found!")
    print("  Run 'python train_model.py' first.")
    exit(1)

print("Loading model...")
model = joblib.load(MODEL_FILE)
print(f"Model ready!")
print(f"  Crops    : {list(model.classes_)}")
print(f"  Features : {model.n_features_in_}")

# ─── SEASON MAP ───────────────────────────────────────────────────────────────
# Must match CROP_SEASON_MAP in train_model.py exactly
CROP_SEASON_MAP = {
    'rice':        'kharif',
    'maize':       'kharif',
    'kidneybeans': 'kharif',
    'pigeonpeas':  'kharif',
    'mothbeans':   'kharif',
    'mungbean':    'kharif',
    'blackgram':   'kharif',
    'cotton':      'kharif',
    'jute':        'kharif',
    'coffee':      'kharif',
    'banana':      'kharif',
    'papaya':      'kharif',
    'coconut':     'kharif',
    'pomegranate': 'kharif',
    'wheat':       'rabi',
    'chickpea':    'rabi',
    'lentil':      'rabi',
    'grapes':      'rabi',
    'apple':       'rabi',
    'orange':      'rabi',
    'watermelon':  'zaid',
    'muskmelon':   'zaid',
    'mango':       'zaid',
    'sugarcane':   'kharif',
    'mustard':     'rabi',
    'barley':      'rabi',
}

# Season encoding — must match train_model.py
SEASON_ENCODE = { 'kharif': 0, 'rabi': 1, 'zaid': 2 }

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        season_str     = str(data.get('season', 'kharif')).lower()
        season_encoded = SEASON_ENCODE.get(season_str, 0)

        
        features = np.array([[
            float(data['nitrogen']),
            float(data['phosphorus']),
            float(data['potassium']),
            float(data['temperature']),
            float(data['humidity']),
            float(data['ph']),
            float(data['rainfall']),
            season_encoded
        ]])

        
        predicted_crop = model.predict(features)[0]
        probas         = model.predict_proba(features)[0]
        top5_idx       = np.argsort(probas)[-5:][::-1]
        top_five = [
            {
                'crop':       model.classes_[i],
                'confidence': round(float(probas[i]) * 100, 1)
            }
            for i in top5_idx
        ]

        return jsonify({
            'topCrop':    predicted_crop,
            'confidence': top_five[0]['confidence'],
            'topFive':    top_five,
            'season':     season_str
        })

    except KeyError as e:
        return jsonify({ 'error': f'Missing field: {str(e)}' }), 400
    except Exception as e:
        return jsonify({ 'error': str(e) }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':   'ok',
        'crops':    list(model.classes_),
        'features': model.n_features_in_,
        'dataset':  'Crop_recommendation_augmented.csv',
        'n_samples': 9966,
        'algorithm': 'RandomForest (200 trees)',
        'test_accuracy': '99.80%',
        'season_map': CROP_SEASON_MAP,
    })

@app.route('/crops', methods=['GET'])
def crops():
    """Return all supported crops grouped by season."""
    grouped = {}
    for crop, season in CROP_SEASON_MAP.items():
        grouped.setdefault(season, []).append(crop)
    return jsonify({
        'total': len(CROP_SEASON_MAP),
        'by_season': grouped,
        'season_encoding': SEASON_ENCODE,
    })

if __name__ == '__main__':
    print("CropSmart Model API running on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=False)




