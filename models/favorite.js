const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  city: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// הוודא שלא תהיה כפילות - משתמש לא יוכל להוסיף את אותה עיר פעמיים
favoriteSchema.index({ userId: 1, city: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
