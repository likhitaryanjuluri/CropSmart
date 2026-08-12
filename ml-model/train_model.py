
import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib

np.random.seed(42)

DATASET_FILE = 'Crop_recommendation_augmented.csv'

# ─── SEASON MAP ───────────────────────────────────────────────────────────────
# Assign each crop its primary growing season 
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

# Encode season as a number
SEASON_ENCODE = { 'kharif': 0, 'rabi': 1, 'zaid': 2 }

print(f"Loading dataset from '{DATASET_FILE}'...")
df = pd.read_csv(DATASET_FILE)

# ─── VALIDATE ────────────────────────────────────────────────────────────────
expected = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'label']
missing  = [c for c in expected if c not in df.columns]
if missing:
    print(f"ERROR: Missing columns: {missing}")
    exit(1)

# Drop nulls
df = df.dropna()

print(f"  Rows   : {len(df)}")
print(f"  Crops  : {df['label'].nunique()}")

# ─── ADD SEASON AS A FEATURE ──────────────────────────────────────────────────
print("\nAdding season as a training feature...")

# Map each crop to its season, then encode as integer
df['season'] = df['label'].map(CROP_SEASON_MAP)

# Warn if any crop is unmapped
unmapped = df[df['season'].isna()]['label'].unique()
if len(unmapped) > 0:
    print(f"  Warning: No season mapping for: {unmapped} — defaulting to kharif")
    df['season'] = df['season'].fillna('kharif')

df['season_encoded'] = df['season'].map(SEASON_ENCODE)

print("  Season distribution:")
for season, count in df['season'].value_counts().items():
    print(f"    {count} samples")

# ─── FEATURE STATS ───────────────────────────────────────────────────────────
print(f"\nFeature Statistics:")
feature_cols = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'season_encoded']
print(df[feature_cols].describe().round(2).to_string())

# ─── PREPARE FEATURES ────────────────────────────────────────────────────────
# Now includes season_encoded as the 8th feature
X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'season_encoded']]
y = df['label']

# ─── TRAIN / TEST SPLIT ───────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\nTrain/Test Split:")
print(f"  Training : {len(X_train)} samples")
print(f"  Testing  : {len(X_test)} samples")

# ─── TRAIN RANDOM FOREST ──────────────────────────────────────────────────────
print(f"\nTraining Random Forest (200 trees) with season feature...")
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=None,
    min_samples_split=2,
    min_samples_leaf=1,
    max_features='sqrt',
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)
print("  Done!")

# ─── EVALUATE ────────────────────────────────────────────────────────────────
y_pred    = model.predict(X_test)
acc       = accuracy_score(y_test, y_pred)
cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')

print(f"\nModel Evaluation:")
print(f"  Test Accuracy      : {acc * 100:.2f}%")
print(f"  Cross-Val (5-fold) : {cv_scores.mean()*100:.2f}% +/- {cv_scores.std()*100:.2f}%")

print(f"\nClassification Report:")
print(classification_report(y_test, y_pred))

# ─── FEATURE IMPORTANCE ──────────────────────────────────────────────────────
print(f"\nFeature Importances:")
importances = sorted(zip(X.columns, model.feature_importances_), key=lambda x: -x[1])
for feat, imp in importances:
    bar = "#" * int(imp * 60)
    print(f"  {feat:20s}  {imp:.4f}  {bar}")

# ─── CONFUSION MATRIX SUMMARY ────────────────────────────────────────────────
cm             = confusion_matrix(y_test, y_pred, labels=model.classes_)
misclassified  = int(cm.sum() - cm.diagonal().sum())
print(f"\nConfusion Matrix Summary:")
print(f"  Correctly classified : {len(y_test) - misclassified}")
print(f"  Misclassified        : {misclassified} out of {len(y_test)}")

# ─── SAVE MODEL ──────────────────────────────────────────────────────────────
joblib.dump(model, 'crop_model.pkl')
print(f"\nModel saved to 'crop_model.pkl'")
print(f"  File size : {os.path.getsize('crop_model.pkl') / 1024:.1f} KB")
print(f"  Features  : {list(X.columns)}")

































'''
# ─── SAMPLE PREDICTIONS ──────────────────────────────────────────────────────
print(f"\nSample Predictions (same soil, different seasons):")
base = [90, 42, 43, 20.8, 82.0, 6.5, 202.9]
for season_name, season_code in SEASON_ENCODE.items():
    arr  = np.array([base + [season_code]])
    pred = model.predict(arr)[0]
    prob = max(model.predict_proba(arr)[0]) * 100
    print(f"  Season: {season_name:10s} -> {pred:15s} ({prob:.1f}% confidence)")

'''

'''
print(f"""
How to use:
  import joblib, numpy as np
  model = joblib.load('crop_model.pkl')

  # season: kharif=0, rabi=1, zaid=2
  sample = np.array([[90, 42, 43, 20.8, 82.0, 6.5, 202.9, 0]])
  print(model.predict(sample))
""")'''
