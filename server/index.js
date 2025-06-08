const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

app.use(cors());
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
  console.log(`Server running at http://localhost:${port}`);
}); 