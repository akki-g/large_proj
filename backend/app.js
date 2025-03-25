// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.options('*', cors({ origin: '*' }));

app.use(bodyParser.json({
    limit: '50mb',
    type: 'application/json'
}));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
    type: 'application/x-www-form-urlencoding'
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    // You can set CORS headers here as well if needed
    res.status(500).send({ error: 'Server Error' });
  });

// Start the server
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
