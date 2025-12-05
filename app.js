require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routers/authRoutes');
const farmerAuthRoutes = require('./routers/farmerAuthRoutes');
const farmRoutes = require('./routers/farmRoutes');
const dataRoutes = require('./routers/dataRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',     // allow all mobile requests
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Routes
app.use('/api/auth', authRoutes);

// 1. Farmer routes
app.use('/api/farmer-auth', farmerAuthRoutes); 
app.use('/api/farm', farmRoutes);
app.use('/api/data', dataRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

module.exports = app;
