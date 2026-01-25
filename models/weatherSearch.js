const mongoose = require('mongoose');

const weatherSearchSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  city: { 
    type: String, 
    required: true 
  },
  temperature: { 
    type: Number, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  icon: {
    type: String,
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('WeatherSearch', weatherSearchSchema);
