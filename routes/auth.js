const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/users');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'שם משתמש וסיסמה נדרשים' });
    }

    if (password.length < 3) {
      return res.status(400).json({ error: 'הסיסמה חייבת להיות לפחות 3 תווים' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'המשתמש כבר קיים' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.json({ message: 'המשתמש נרשם בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // בדיקה אם לא הכניס שם משתמש
    if (!username && !password) {
      return res.status(400).json({ error: 'לא הכנסת שם משתמש וסיסמה' });
    }
    
    if (!username) {
      return res.status(400).json({ error: 'לא הכנסת שם משתמש' });
    }
    
    if (!password) {
      return res.status(400).json({ error: 'לא הכנסת סיסמה' });
    }

    if (password.length < 3) {
      return res.status(400).json({ error: 'הסיסמה חייבת להיות לפחות 3 תווים' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'שם משתמש או סיסמה שגויים' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'שם משתמש או סיסמה שגויים' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

module.exports = router;
