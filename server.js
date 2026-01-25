// Load environment variables from .env file
require('dotenv').config();

// Import required libraries
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const auth = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const weatherRoutes = require('./routes/weather');


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

const User = mongoose.model('user', userSchema);

// Default route (login page)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Middleware

// Parse JSON bodies
app.use(express.json());

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));


app.use(express.json());
app.use(express.static('public'));

app.use(authRoutes);
app.use(weatherRoutes);



// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
