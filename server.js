// Load environment variables from .env file
require('dotenv').config();

// Import required libraries
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

// Fetch implementation that works in Node.js
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('🚀 You can now run the website in your browser');
    console.log('Enjoy!!');
  })
  .catch(err => console.error('❌ MongoDB connection error', err));

// User model (schema)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Default route (login page)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Middleware

// Parse JSON bodies
app.use(express.json());

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// JWT authentication middleware
function auth(req, res, next) {
    const authHeader = req.headers.authorization;

    // No token provided
    if (!authHeader) {
        return res.status(401).json({ error: 'Token missing' });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    try {
        // Verify token and attach decoded data to request
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// Register new user
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save new user
        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();

        res.json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login user
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user in database
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // Compare password with hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Protected weather route
app.get('/weather', auth, async (req, res) => {
    const city = req.query.city?.trim();

    // City is required
    if (!city) {
        return res.status(400).json({ error: 'City is required' });
    }

    try {
        // Build OpenWeather API URL
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.API_KEY}&units=metric&lang=en`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        // City not found
        if (data.cod !== 200) {
            return res.status(404).json({ error: 'City not found' });
        }

        // Send weather data to client
        res.json({
            city: data.name,
            temperature: Math.round(data.main.temp),
            unit: 'C',
            description: data.weather[0].description,
            icon: data.weather[0].icon
        });

    } catch (error) {
        console.error('❌ Weather API error:', error);
        res.status(500).json({ error: 'Weather service error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
