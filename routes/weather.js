const express = require('express');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const auth = require('../middleware/auth');
const WeatherSearch = require('../models/weatherSearch');
const Favorite = require('../models/favorite');

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

    const weatherData = {
      city: data.name,
      temperature: Math.round(data.main.temp),
      unit: 'C',
      description: data.weather[0].description,
      icon: data.weather[0].icon
    };

    // 💾 שמירת החיפוש במסד הנתונים
    try {
      const weatherSearch = new WeatherSearch({
        userId: req.user.id,
        city: weatherData.city,
        temperature: weatherData.temperature,
        description: weatherData.description,
        icon: weatherData.icon
      });
      await weatherSearch.save();
    } catch (saveError) {
      // אם השמירה נכשלה, ממשיכים - לא משפיע על המשתמש
      console.error('❌ Failed to save search history:', saveError);
    }

    res.json(weatherData);
  } catch (err) {
    res.status(500).json({ error: 'Weather service error' });
  }
});

// --------------------
// Get user's search history
// --------------------
router.get('/history', auth, async (req, res) => {
  try {
    const searches = await WeatherSearch.find({ userId: req.user.id })
      .sort({ createdAt: -1 }) // הכי חדש קודם
      .limit(20); // מגביל ל-20 חיפושים אחרונים

    res.json({ history: searches });
  } catch (err) {
    console.error('❌ Failed to fetch history:', err);
    res.status(500).json({ error: 'שגיאה בטעינת ההיסטוריה' });
  }
});

// --------------------
// Add city to favorites
// --------------------
router.post('/favorites', auth, async (req, res) => {
  try {
    const { city } = req.body;

    if (!city) {
      return res.status(400).json({ error: 'עיר נדרשת' });
    }

    const favorite = new Favorite({
      userId: req.user.id,
      city: city.trim()
    });

    await favorite.save();
    res.json({ message: 'הוסף למועדפים בהצלחה' });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ error: 'העיר כבר במועדפים' });
    }
    console.error('❌ Failed to add favorite:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// --------------------
// Get user's favorites
// --------------------
router.get('/favorites', auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json({ favorites });
  } catch (err) {
    console.error('❌ Failed to fetch favorites:', err);
    res.status(500).json({ error: 'שגיאה בטעינת המועדפים' });
  }
});

// --------------------
// Remove from favorites
// --------------------
router.delete('/favorites/:city', auth, async (req, res) => {
  try {
    const { city } = req.params;

    await Favorite.deleteOne({ userId: req.user.id, city: city });
    res.json({ message: 'הוסר מהמועדפים' });
  } catch (err) {
    console.error('❌ Failed to remove favorite:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

module.exports = router;
