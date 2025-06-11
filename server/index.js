const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS with allowed origins
const allowedOrigins = [
  'http://localhost:3000',  // Local development
  'https://lad-omega.vercel.app'  // Vercel deployment
];

// Simple CORS configuration
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Serve static files from the data directory
app.use('/data', express.static(path.join(__dirname, '../data')));

// Endpoint to get all works and their connections
app.get('/api/works', (req, res) => {
  try {
    const worksData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/works.json'), 'utf8'));
    res.json(worksData);
  } catch (error) {
    console.error('Error reading works data:', error);
    res.status(500).json({ error: 'Failed to load works data' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Allowed origins:', allowedOrigins);
}); 