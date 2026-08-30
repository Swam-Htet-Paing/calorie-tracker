const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foodName: { type: String, required: true },
  weightGrams: { type: Number, required: true },
  calories: { type: Number, required: true },
  date: { type: String, required: true }
}, { timestamps: true });

// Pass 'Log' as the 3rd argument to force Mongoose to use your exact collection name
module.exports = mongoose.model('Log', LogSchema, 'Log');