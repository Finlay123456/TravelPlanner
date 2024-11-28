// Import required libraries
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');
const { auth } = require('./firebase');
const verifyToken = require('./middlewares/auth');
const adminAuth = require('./firebase-admin').auth;
const { sendPasswordResetEmail } = require('firebase/auth');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const storage = require('node-persist');

// Initialize express
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'client')));

// Directory for node-persist storage
const dataDir = path.join(__dirname, 'data', 'storage');

// Initialize node-persist storage and load CSV data if empty
async function initializeStorage() {
  await storage.init({
    dir: dataDir,
    stringify: JSON.stringify,
    parse: JSON.parse,
  });

  try {
    // Check if data already exists in storage
    const existingData = await storage.getItem('destinations');
    if (!existingData || existingData.length === 0) {
      const destinations = [];

      // Read and parse CSV file synchronously
      await new Promise((resolve, reject) => {
        fs.createReadStream(path.join(__dirname, 'data/csv/europe-destinations.csv'))
          .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
          .on('data', (row) => {
            destinations.push(row);
          })
          .on('end', async () => {
            try {
              await storage.setItem('destinations', destinations);
              console.log('CSV data loaded into storage.');
              resolve();
            } catch (error) {
              reject(error);
            }
          })
          .on('error', (error) => {
            reject(error);
          });
      });
    } else {
      console.log('Data already exists in storage.');
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Routes for Destinations
// Get all destinations
app.get('/destinations', async (req, res) => {
  try {
    const destinations = await storage.getItem('destinations');
    res.json(destinations || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve destinations.' });
  }
});

// Get a destination by ID
app.get('/destination/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10) - 1;

  try {
    const destinations = await storage.getItem('destinations') || [];
    if (id >= 0 && id < destinations.length) {
      res.json(destinations[id]);
    } else {
      res.status(404).json({ error: 'Destination not found.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve destination.' });
  }
});

// Get latitude and longitude for a destination by ID
app.get('/destination/:id/coordinates', async (req, res) => {
  const id = parseInt(req.params.id, 10) - 1;

  try {
    const destinations = await storage.getItem('destinations') || [];
    if (id >= 0 && id < destinations.length) {
      const destination = destinations[id];
      const coordinates = {
        latitude: destination.Latitude,
        longitude: destination.Longitude,
      };
      res.json(coordinates);
    } else {
      res.status(404).json({ error: 'Destination not found.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve coordinates.' });
  }
});

// Get all unique country names
app.get('/countries', async (req, res) => {
  try {
    const destinations = await storage.getItem('destinations') || [];
    const countries = [...new Set(destinations.map((dest) => dest.Country))];
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve countries.' });
  }
});

// Search destinations by field and pattern
app.get('/search', async (req, res) => {
  const { field, pattern, n } = req.query;
  const maxResults = n ? parseInt(n, 10) : Infinity;

  try {
    const destinations = await storage.getItem('destinations') || [];

    if (!destinations.length || !destinations[0].hasOwnProperty(field)) {
      return res.status(400).json({ error: 'Invalid field name' });
    }

    const matchingDestinations = destinations
      .filter((dest) => dest[field].toLowerCase().includes(pattern.toLowerCase()))
      .slice(0, maxResults);

    if (matchingDestinations.length > 0) {
      const destinationIDs = matchingDestinations.map((dest, index) => index + 1);
      res.json(destinationIDs);
    } else {
      res.status(404).json({ error: 'No matching destinations found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to search destinations.' });
  }
});

// Routes for Lists
// Create a list
app.post('/list', async (req, res) => {
  const { listName } = req.body;

  try {
    const existingList = await storage.getItem(`list_${listName}`);
    if (existingList) {
      return res.status(409).json({ error: 'List already exists.' });
    }

    await storage.setItem(`list_${listName}`, []);
    res.status(201).json({ message: `List '${listName}' created successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create list.' });
  }
});

// Update a list
app.put('/list/:listName', async (req, res) => {
  const { listName } = req.params;
  const { destinations } = req.body;

  try {
    const existingList = await storage.getItem(`list_${listName}`);
    if (!existingList) {
      return res.status(404).json({ error: 'List does not exist.' });
    }

    await storage.setItem(`list_${listName}`, destinations);
    res.status(200).json({ message: `List '${listName}' updated successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update list.' });
  }
});

// Get a list
app.get('/list/:listName', async (req, res) => {
  const { listName } = req.params;

  try {
    const list = await storage.getItem(`list_${listName}`);
    if (!list) {
      return res.status(404).json({ error: 'List not found.' });
    }
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve list.' });
  }
});

// Start the server after initializing storage
(async () => {
  try {
    await initializeStorage();
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
})();
