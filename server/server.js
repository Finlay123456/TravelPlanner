// Import required libraries
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } = require('firebase-admin/auth');
const { auth } = require('./firebase-admin');
const verifyToken = require('./middlewares/auth');
const adminAuth = require('./firebase-admin').auth;
const { sendPasswordResetEmail } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { db } = require('./firebase-admin');
const rateLimit = require('express-rate-limit');
const { setDoc, collection, addDoc, getDoc, getDocs, doc, updateDoc, deleteDoc, query, where } = require('firebase-admin/firestore');

// Initialize express
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'client')));

async function initializeStorage() {
    try {
      const destinationsCollection = db.collection('destinations');  // Firestore reference
  
      const querySnapshot = await destinationsCollection.get();  // Query Firestore
  
      if (querySnapshot.empty) {
        const destinations = [];
        
        // Load CSV and insert into Firestore
        fs.createReadStream(path.join(__dirname, 'data/europe-destinations.csv'))
          .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
          .on('data', (row) => {
            destinations.push(row);
          })
          .on('end', async () => {
            try {
              // Add each row from CSV to Firestore
              for (let i = 0; i < destinations.length; i++) {
                const destination = destinations[i];
                destination.customId = i+1;
                await destinationsCollection.add(destination);  // Using Firestore Admin SDK's add method
              }
              console.log('CSV data loaded into Firestore.');
            } catch (error) {
              console.error('Error adding destination to Firestore:', error);
            }
          })
          .on('error', (error) => {
            console.error('Error reading CSV file:', error);
          });
      } else {
        console.log('Data already exists in Firestore.');
      }
    } catch (error) {
      console.error('Error initializing Firestore storage:', error);
    }
}

// Routes for User Management (Firebase)
// Make Admin
app.post('/api/admin/make-admin', verifyToken, async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await adminAuth.getUserByEmail(email);
      await adminAuth.setCustomUserClaims(user.uid, { admin: true });
      res.status(200).json({ message: `${email} is now an admin.` });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
});

// Mark a review as hidden or unhide it
app.post('/api/admin/mark-review-hidden', verifyToken, async (req, res) => {
    if (!req.user.admin) {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { reviewId, hidden } = req.body;

    try {
        const reviewRef = db.collection('reviews').doc(reviewId);
        const reviewDoc = await reviewRef.get();

        if (!reviewDoc.exists) {
            return res.status(404).json({ error: 'Review not found.' });
        }

        // Update the "hidden" field of the review
        await reviewRef.update({ hidden });

        res.status(200).json({ message: `Review ${hidden ? 'hidden' : 'unhidden'} successfully.` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update review visibility.' });
    }
});

// Ban a user (disable their account)
app.post('/api/admin/ban-user', verifyToken, async (req, res) => {
    if (!req.user.admin) {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { email } = req.body;

    try {
        // Get the user by email
        const userRecord = await adminAuth.getUserByEmail(email);

        // Disable the user's account (set disabled to true)
        await adminAuth.updateUser(userRecord.uid, { disabled: true });

        res.status(200).json({ message: `User ${email} has been banned successfully.` });
    } catch (error) {
        res.status(400).json({ error: 'Failed to ban user. User may not exist.' });
    }
});

// Reset Password
app.post('/api/secure/reset-password', async (req, res) => {
    const { email } = req.body;
    try {
      await sendPasswordResetEmail(auth, email);
      res.status(200).json({ message: 'Password reset email sent.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
});
  
// Routes for Destinations
// Get all destinations
app.get('/api/open/destinations', async (req, res) => {
    try {
      const snapshot = await db.collection('destinations')
                               .orderBy('customId', 'asc') // Order by customId in ascending order
                               .get();
      const destinations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(destinations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve destinations.' });
    }
});

// Get a destination by customId
app.get('/api/open/destination/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Convert the id to a number, since customId is stored as a number in Firestore
        const customIdAsNumber = parseInt(id, 10);

        // Query Firestore for the destination with the given customId (now a number)
        const snapshot = await db.collection('destinations').where('customId', '==', customIdAsNumber).get();

        // Check if we got a result
        if (snapshot.empty) {
            return res.status(404).json({ error: 'Destination not found.' });
        }

        // Since we only expect one result (customId is unique), take the first match
        const destination = snapshot.docs[0];

        // Send the response with the full document
        res.json({ id: destination.id, ...destination.data() });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve destination.' });
    }
});


// Get latitude and longitude for a destination by ID
app.get('/api/open/destination/:id/coordinates', async (req, res) => {
    const id = req.params.id;
  
    try {
      const doc = await db.collection('destinations').doc(id).get();
      if (doc.exists) {
        const { latitude, longitude } = doc.data();
        res.json({ latitude, longitude });
      } else {
        res.status(404).json({ error: 'Destination not found.' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve coordinates.' });
    }
});
  
// Get all unique country names
app.get('/api/open/countries', async (req, res) => {
    try {
      const snapshot = await db.collection('destinations')
                               .orderBy('customId', 'asc') // Ensure data is in correct order
                               .get();
      const countries = [...new Set(snapshot.docs.map(doc => doc.data().Country))];
      res.json(countries);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve countries.' });
    }
});
  

// Search destinations by field and pattern
app.get('/api/open/search', async (req, res) => {
    const { field, pattern, n } = req.query;
    const maxResults = n ? parseInt(n, 10) : Infinity;

    try {
        const snapshot = await db.collection('destinations')
                                 .orderBy('customId', 'asc')
                                 .get();
        const destinations = snapshot.docs.map(doc => doc.data());

        if (!destinations.length || !Object.keys(destinations[0]).includes(field)) {
            return res.status(400).json({ error: 'Invalid field name.' });
        }

        const matchingDestinations = destinations
            .filter(dest => dest[field]?.toLowerCase().includes(pattern.toLowerCase()))
            .slice(0, maxResults);

        if (matchingDestinations.length > 0) {
            res.json(matchingDestinations);
        } else {
            res.status(404).json({ error: 'No matching destinations found.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to search destinations.' });
    }
});

// Routes for Lists
// Create a list
app.post('/api/secure/list', async (req, res) => {
    const { listName } = req.body;
  
    try {
      const docRef = db.collection('lists').doc(listName);
      const doc = await docRef.get();
  
      if (doc.exists) {
        return res.status(409).json({ error: 'List already exists.' });
      }
  
      await docRef.set({ destinations: [], lastModified: new Date().toISOString() });
      res.status(201).json({ message: `List '${listName}' created successfully.` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create list.' });
    }
});
  

// Update a list
app.put('/api/secure/list/:listName', async (req, res) => {
    const { listName } = req.params;
    const { destinations } = req.body;
  
    try {
      const docRef = db.collection('lists').doc(listName);
      const doc = await docRef.get();
  
      if (!doc.exists) {
        return res.status(404).json({ error: 'List does not exist.' });
      }
  
      await docRef.update({ destinations, lastModified: new Date().toISOString() });
      res.status(200).json({ message: `List '${listName}' updated successfully.` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update list.' });
    }
});
  

// Get a list
app.get('/api/secure/list/:listName', async (req, res) => {
    const { listName } = req.params;

    try {
        const docRef = db.collection('lists').doc(listName);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'List not found.' });
        }

        const listData = doc.data();
        const destinations = await Promise.all(
            listData.destinations.map(async customId => {
                const destSnapshot = await db.collection('destinations')
                                             .where('customId', '==', customId)
                                             .get();
                return destSnapshot.empty ? null : destSnapshot.docs[0].data();
            })
        );

        res.json(destinations.filter(Boolean));
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve list.' });
    }
});

// Delete a list
app.delete('/api/secure/list/:listName', async (req, res) => {
    const { listName } = req.params;
  
    try {
      const docRef = db.collection('lists').doc(listName);
      const doc = await docRef.get();
  
      if (!doc.exists) {
        return res.status(404).json({ error: 'List not found.' });
      }
  
      await docRef.delete();
      res.status(200).json({ message: `List '${listName}' deleted successfully.` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete list.' });
    }
});
  

// Get all list names
app.get('/api/secure/lists', async (req, res) => {
    try {
      const snapshot = await db.collection('lists').get();
      const listNames = snapshot.docs.map(doc => doc.id);
      res.json(listNames);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve list names.' });
    }
});
  
// Get detailed information about a list
app.get('/api/secure/list/:listName/details', async (req, res) => {
    const { listName } = req.params;
  
    try {
      const doc = await db.collection('lists').doc(listName).get();
  
      if (!doc.exists) {
        return res.status(404).json({ error: 'List not found.' });
      }
  
      const listData = doc.data();
      const destinations = await Promise.all(
        listData.destinations.map(async id => {
          const destDoc = await db.collection('destinations').doc(id).get();
          return destDoc.exists ? destDoc.data() : null;
        })
      );
  
      res.json(destinations.filter(Boolean));
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve list details.' });
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
