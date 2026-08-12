const router = require("express").Router();

router.get("/", async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                error: "Latitude and longitude required"
            });
        }

        console.time("weather-route");

        // ==========================
        // WEATHER DATA (Open-Meteo)
        // ==========================
        console.time("open-meteo");

        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m&daily=precipitation_sum&forecast_days=7`
        );

        console.timeEnd("open-meteo");

        if (!weatherResponse.ok) {
            throw new Error(
                `Weather API failed: ${weatherResponse.status}`
            );
        }

        const weatherData = await weatherResponse.json();

        // ==========================
        // Rainfall Total
        // ==========================
        const rainfall = Array.isArray(
            weatherData?.daily?.precipitation_sum
        )
            ? weatherData.daily.precipitation_sum.reduce(
                  (sum, value) =>
                      sum + (Number(value) || 0),
                  0
              )
            : 0;

        console.timeEnd("weather-route");

        // ==========================
        // RESPONSE
        // ==========================
        res.json({
            temperature: Math.round(
                weatherData?.current?.temperature_2m || 0
            ),

            humidity:
                weatherData?.current
                    ?.relative_humidity_2m || 0,

            rainfall: Math.round(rainfall),

            location: {
                latitude: Number(lat),
                longitude: Number(lon)
            }
        });
    } catch (err) {
        console.error(
            "Weather Route Error:",
            err.message
        );

        res.status(500).json({
            error: "Failed to fetch weather data"
        });
    }
});

module.exports = router;