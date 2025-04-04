// app.js
require('dotenv').config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
});
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware
app.use(cors({ 
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Content-Type-Options'],
  credentials: true,
  maxAge: 86400
}));
app.options('*', cors({ origin: '*' }));

app.use((req, res, next) => {
  console.log('Request Content-Type:', req.headers['content-type']);
  next();
});

app.use((req, res, next) => {
  const contentType = req.get('Content-Type') || '';
  
  // Skip body parsing for multipart requests (let multer handle those)
  if (contentType.includes('multipart/form-data')) {
    return next();
  }
  
  // For JSON requests
  if (contentType.includes('application/json')) {
    bodyParser.json({ limit: '50mb' })(req, res, next);
  }
  // For URL-encoded requests
  else if (contentType.includes('application/x-www-form-urlencoded')) {
    bodyParser.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
  }
  // For all other requests, just continue
  else {
    next();
  }
});
// Connect to MongoDB
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));
}
// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/quiz', require('./routes/quizRoutes'));


app.use((err, req, res, next) => {
    console.error(err.stack);
    // You can set CORS headers here as well if needed
    res.status(500).send({ error: 'Server Error' });
  });

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}


module.exports = app;
