require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Log = require('./models/Log');
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Higher limit to support Base64 avatar uploads

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. Token missing.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
};

// --- Serve Static Assets ---
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));
app.use(express.static(path.join(frontendPath, 'html')));

// --- Page Routes ---
app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'html', 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(frontendPath, 'html', 'login.html')));
app.get('/bmi.html', (req, res) => res.sendFile(path.join(frontendPath, 'html', 'bmi.html')));
app.get('/exercise.html', (req, res) => res.sendFile(path.join(frontendPath, 'html', 'exercise.html')));
app.get('/banner.html', (req, res) => res.sendFile(path.join(frontendPath, 'html', 'banner.html')));

// --- Auth API Routes ---
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, avatar } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ error: 'User already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword,
      avatar: avatar || ''
    });
    await newUser.save();

    // Respond success without token so frontend forces login
    res.status(201).json({ message: 'Registration successful. Please log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Auto-generate avatar if custom profile picture was not provided
    const avatarUrl = user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`;

    res.json({ token, username: user.username, avatar: avatarUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const avatarUrl = user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`;
    res.json({ username: user.username, email: user.email, avatar: avatarUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user data.' });
  }
});

// --- Food Search API ---
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

app.put('/api/auth/avatar', authenticateToken, async (req, res) => {
  const { avatar } = req.body;
  if (!avatar) return res.status(400).json({ error: 'Avatar image data required.' });

  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { avatar },
      { new: true }
    ).select('-password');

    res.json({ message: 'Avatar updated successfully', avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});

// --- Protected Log Routes ---
app.get('/api/logs', authenticateToken, async (req, res) => {
  const { date } = req.query;
  try {
    const logs = await Log.find({ userId: req.user.userId, date });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

app.post('/api/logs', authenticateToken, async (req, res) => {
  const { foodName, weightGrams, calories, date } = req.body;
  try {
    const newLog = new Log({ userId: req.user.userId, foodName, weightGrams, calories, date });
    await newLog.save();
    res.status(201).json(newLog);
  } catch (err) {
    res.status(400).json({ error: 'Failed to save log' });
  }
});

app.delete('/api/logs/:id', authenticateToken, async (req, res) => {
  try {
    await Log.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Log deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete log item' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));