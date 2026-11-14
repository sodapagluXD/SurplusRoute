const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); 

// Connect to Database
connectDB(); // <-- Commented out temporarily until you put your real MONGODB_URI in .env

// Health Check Endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'SurplusRoute API is live' });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));