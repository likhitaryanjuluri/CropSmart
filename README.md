# CropSmart – Climate Smart Agricultural Prediction & Soil Management Platform

CropSmart is a full-stack **Climate Smart Agriculture** platform designed to help farmers make better crop-selection and soil-management decisions using **Machine Learning, weather information, soil data, and agricultural recommendations**.

The system combines a **React.js frontend**, **Node.js/Express backend**, **MongoDB database**, and a **Python Flask Machine Learning service**. It uses a Random Forest model to recommend suitable crops based on soil nutrients, weather conditions, soil pH, rainfall, and season.

---

## Project Overview

Agriculture depends heavily on soil quality, rainfall, temperature, humidity, and nutrient availability. Selecting an unsuitable crop can lead to reduced productivity, inefficient fertilizer usage, and poor soil management.

CropSmart addresses this problem by providing a platform where users can provide agricultural parameters and receive intelligent recommendations.

The system provides:

- 🌾 Top 5 crop recommendations
- 📊 Crop confidence scores
- 🌱 Soil health analysis
- 🧪 Fertilizer recommendations
- 🌦️ Weather information
- 📍 Location-based environmental information
- 📜 Prediction history
- 🔐 User authentication
- 🌐 Multilingual support

The Machine Learning component uses a **Random Forest Classifier** trained on an augmented crop recommendation dataset.

---

# Objectives

The main objectives of CropSmart are:

1. Recommend suitable crops based on soil and environmental conditions.
2. Help farmers make data-driven agricultural decisions.
3. Analyze soil-related parameters and provide soil health information.
4. Provide fertilizer recommendations.
5. Integrate weather information into crop recommendation.
6. Use location-based environmental information.
7. Maintain users' prediction history.
8. Provide an easy-to-use multilingual interface.
9. Integrate Machine Learning with a modern full-stack web application.

---

# Key Features

## Crop Recommendation

CropSmart analyzes agricultural parameters such as:

- Nitrogen (N)
- Phosphorus (P)
- Potassium (K)
- Temperature
- Humidity
- Soil pH
- Rainfall
- Season

The Machine Learning model predicts suitable crops and provides the **top 5 recommendations** along with confidence scores.

---

##  Machine Learning

CropSmart uses a **Random Forest Classification** model for crop recommendation.

### Model Details

| Property | Value |
|---|---|
| Algorithm | Random Forest Classifier |
| Number of Trees | 200 |
| Dataset | Crop_recommendation_augmented.csv |
| Number of Crops | 22 |
| Training Samples | Approximately 9,966 |
| Reported Test Accuracy | 99.80% |

The trained model is stored as:

```text
ml-model/crop_model.pkl