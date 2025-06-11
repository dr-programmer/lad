const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS with allowed origins
const allowedOrigins = [
  'http://localhost:3000',  // Local development
  'https://lad-omega.vercel.app/',  // Vercel deployment
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 