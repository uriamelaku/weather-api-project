const express = require('express');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const auth = require('../middleware/auth');

const router = express.Router();

// --------------------
// Protected weather route
// --------------------
router.get('/weather', auth, async (req, res) => {
  const city = req.query.city?.trim();

  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  try {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city
    )}&appid=${process.env.API_KEY}&units=metric&lang=he`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.cod !== 200) {
      return res.status(404).json({ error: 'City not found' });
    }

    res.json({
      city: data.name,
      temperature: Math.round(data.main.temp),
      unit: 'C',
      description: data.weather[0].description,
      icon: data.weather[0].icon
    });
  } catch (err) {
    res.status(500).json({ error: 'Weather service error' });
  }
});

module.exports = router;
