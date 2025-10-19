const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust the first hop from the proxy (e.g., Render's load balancer)
// This is crucial for rate limiting to work correctly with req.ip
app.set('trust proxy', 1);

// Middleware
app.use(cors());
// Use default JSON body limit as large avatar payloads are no longer sent to the server.
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api', apiRoutes);

// Simple root route to check if server is running
app.get('/', (req, res) => {
    res.send('CineStream Backend is running!');
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});