require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Log = require('./models/Log');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Serve Static Assets ---
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));
app.use(express.static(path.join(frontendPath, 'html'))); // Serves HTML files directly from root domain

// --- Route Handlers ---
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'html', 'index.html'));
});

app.get('/bmi.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'html', 'bmi.html'));
});

app.get('/exercise.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'html', 'exercise.html'));
});

app.get('/banner.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'html', 'banner.html'));
});

// --- API Routes ---
app.get('/api/foods/search', async (req, res) => {
  const { query } = req.query;
  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${process.env.USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=5`
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch food data' });
  }
});

app.get('/api/logs', async (req, res) => {
  const { userId, date } = req.query;
  try {
    const logs = await Log.find({ userId, date });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

app.post('/api/logs', async (req, res) => {
  const { userId, foodName, weightGrams, calories, date } = req.body;
  try {
    const newLog = new Log({ userId, foodName, weightGrams, calories, date });
    await newLog.save();
    res.status(201).json(newLog);
  } catch (err) {
    res.status(400).json({ error: 'Failed to save log' });
  }
});

app.delete('/api/logs/:id', async (req, res) => {
  try {
    await Log.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Log deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete log item' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));