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
const { normalizeString } = require('./utils');
const stringSimilarity = require('string-similarity');
const { admin, assignAdminRole, checkIfAdmin } = require('./firebase-admin');
const { getAuth } = require('firebase-admin/auth');


// Initialize express
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'client')));

    assignAdminRole('qQOOXdmvE4arEYkmuQN6TGiInyw1');

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
      await adminAuth.setCustomUserClaims(user.uid, { isAdmin: true });
      console.log(user);
      res.status(200).json({ message: `${email} is now an admin.` });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
});

app.post('/api/admin/remove-admin', verifyToken, async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await adminAuth.getUserByEmail(email);
      await adminAuth.setCustomUserClaims(user.uid, { isAdmin: false });
      console.log(user);
      res.status(200).json({ message: `${email} is no longer an admin.` });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
});

app.get('/api/check-admin', async (req, res) => {
    const idToken = req.headers.authorization?.split("Bearer ")[1]; // Extract token from Authorization header
    if (!idToken) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    try {
        const isAdmin = await checkIfAdmin(idToken);
        res.json({ isAdmin });
    } catch (error) {
        console.error("Error checking admin status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Fetch all reviews from lists
app.get('/api/admin/reviews', verifyToken, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    try {
        const listsSnapshot = await db.collection('lists').get();
        const reviews = [];

        for (const listDoc of listsSnapshot.docs) {
            const listData = listDoc.data();
            const listName = listData.name || "Unknown List";

            // Ensure reviews exist and are an array
            if (Array.isArray(listData.reviews)) {
                for (let i = 0; i < listData.reviews.length; i++){
                    const review = listData.reviews[i];
                    reviews.push({
                        listId: listDoc.id,
                        listName: listName,
                        reviewIndex: i,
                        rating: review.rating || 0,
                        comment: review.comment || "No comment provided.",
                        hidden: review.hidden || false,
                    });
                }
            }
        }

        res.status(200).json(reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ error: 'Failed to fetch reviews.' });
    }
});

// Toggle the hidden status of a review within a list
app.post('/api/admin/toggle-review-hidden', verifyToken, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { listId, reviewIndex, hidden } = req.body;

    if (listId == null || reviewIndex == null || hidden == null) {
        return res.status(400).json({ error: 'Missing required fields: listId, reviewIndex, or hidden.' });
    }

    try {
        const listRef = db.collection('lists').doc(listId);
        const listDoc = await listRef.get();

        if (!listDoc.exists) {
            return res.status(404).json({ error: 'List not found.' });
        }

        const reviews = listDoc.data().reviews || [];

        // Ensure the review index is valid
        if (reviewIndex < 0 || reviewIndex >= reviews.length) {
            return res.status(404).json({ error: 'Review not found at the specified index.' });
        }

        // Update the hidden status of the specific review
        reviews[reviewIndex].hidden = hidden;

        // Update the list document with the modified reviews array
        await listRef.update({ reviews });

        res.status(200).json({ message: `Review at index ${reviewIndex} in list '${listId}' has been ${hidden ? 'hidden' : 'unhidden'}.` });
    } catch (error) {
        console.error('Error toggling review visibility:', error);
        res.status(500).json({ error: 'Failed to toggle review visibility.' });
    }
});


// Ban a user (disable their account)
app.post('/api/admin/ban-user', verifyToken, async (req, res) => {
    if (!req.user.isAdmin) {
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

// Unban a user (enable their account)
app.post('/api/admin/unban-user', verifyToken, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { email } = req.body;

    try {
        // Get the user by email
        const userRecord = await adminAuth.getUserByEmail(email);

        // Enable the user's account (set disabled to false)
        await adminAuth.updateUser(userRecord.uid, { disabled: false });

        res.status(200).json({ message: `User ${email} has been unbanned successfully.` });
    } catch (error) {
        console.error("Error unbanning user:", error);
        res.status(400).json({ error: 'Failed to unban user. User may not exist.' });
    }
});


// Fetch all users from Firebase Authentication
app.get("/api/admin/users", verifyToken, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
    }

    try {
        const listUsersResult = await adminAuth.listUsers();
        const users = listUsersResult.users.map((user) => ({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "Anonymous",
            disabled: user.disabled || false,
            admin: user.customClaims?.admin || false, // Check if the user is an admin
        }));

        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users." });
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
    const { name = "", country = "", region = "", n } = req.query;
    const maxResults = n ? parseInt(n, 10) : 209; // Default to 209 if no maxResults is provided

    const SIMILARITY_THRESHOLD = 0.7; // Adjust for stricter/looser matching

    try {
        const snapshot = await db.collection('destinations')
                                 .orderBy('customId', 'asc') // Ensure results are in order
                                 .get();

        const destinations = snapshot.docs.map(doc => doc.data());

        if (!destinations.length) {
            return res.status(404).json({ error: 'No destinations available.' });
        }

        const matchingDestinations = destinations
            .filter(dest => {
                // Normalize fields for comparison
                const destName = normalizeString(dest["Destination"] || "");
                const destCountry = normalizeString(dest["Country"] || "");
                const destRegion = normalizeString(dest["Region"] || "");

                // Normalize input patterns
                const searchName = normalizeString(name);
                const searchCountry = normalizeString(country);
                const searchRegion = normalizeString(region);

                // Fuzzy match logic
                const matchesName = searchName
                    ? stringSimilarity.compareTwoStrings(searchName, destName) >= SIMILARITY_THRESHOLD
                    : true;

                const matchesCountry = searchCountry
                    ? stringSimilarity.compareTwoStrings(searchCountry, destCountry) >= SIMILARITY_THRESHOLD
                    : true;

                const matchesRegion = searchRegion
                    ? stringSimilarity.compareTwoStrings(searchRegion, destRegion) >= SIMILARITY_THRESHOLD
                    : true;

                // Return true only if all conditions are met
                return matchesName && matchesCountry && matchesRegion;
            })
            .slice(0, maxResults); // Limit the number of results

        if (matchingDestinations.length > 0) {
            res.json(matchingDestinations);
        } else {
            res.status(404).json({ error: 'No matching destinations found.' });
        }
    } catch (error) {
        console.error("Error during search:", error);
        res.status(500).json({ error: 'Failed to search destinations.' });
    }
});


// Routes for Lists
// Create a list in Firestore
app.post('/api/secure/list', verifyToken, async (req, res) => {
    const { listName, visibility, description } = req.body; // Removed `createdBy` from request body
    const creatorId = req.user.uid; // Extracted from the verified token

    // Validate the input
    if (!listName || typeof listName !== 'string') {
        return res.status(400).json({ error: "List name is required and must be a string." });
    }
    if (typeof visibility !== 'boolean') {
        return res.status(400).json({ error: "Visibility must be a boolean (true or false)." });
    }
    if (description && typeof description !== 'string') {
        return res.status(400).json({ error: "Description must be a string." });
    }
    try {
        // Fetch the user’s display name from Firebase Auth
        const userRecord = await getAuth().getUser(creatorId);
        const displayName = userRecord.displayName;

        // Ensure the `displayName` field exists and is a valid string
        if (!displayName || typeof displayName !== 'string') {
            return res.status(400).json({ error: "User does not have a valid display name." });
        }
        const listRef = db.collection('lists').doc(listName); // Use listName as the document ID
        const doc = await listRef.get();

        if (doc.exists) {
            return res.status(409).json({ error: 'List already exists.' });
        }
        // Create a new list document
        await listRef.set({
            name: listName,
            displayName, // Set the creator's display name
            creatorId, // Set the creator's UID
            destinations: [],
            visibility, // Save visibility as a boolean
            description: description || "", // Default to an empty string if not provided
            lastModified: new Date().toISOString(),
        });

        res.status(201).json({ message: `List '${listName}' created successfully.` });
    } catch (error) {
        console.error("Error creating list:", error);
        res.status(500).json({ error: 'Failed to create list.' });
    }
});

// Update a list's destinations or metadata
app.put('/api/secure/list/:listName', verifyToken, async (req, res) => {
    const { listName } = req.params;
    const { destinations, visibility, description } = req.body;

    // Validate the input
    if (typeof visibility !== 'boolean') {
        return res.status(400).json({ error: "Visibility must be a boolean (true or false)." });
    }
    if (description && typeof description !== 'string') {
        return res.status(400).json({ error: "Description must be a string." });
    }

    try {
        const listRef = db.collection('lists').doc(listName);
        const doc = await listRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'List not found.' });
        }

        // Ensure the user has access to update the list
        const listData = doc.data();
        if (listData.creatorId !== req.user.uid) {
            return res.status(403).json({ error: 'You do not have permission to edit this list.' });
        }

        // Update the list
        const updatedFields = {
            destinations: destinations || listData.destinations, // Keep existing destinations if not provided
            visibility, // Update visibility
            description: description || listData.description, // Keep existing description if not provided
            lastModified: new Date().toISOString(),
        };

        await listRef.update(updatedFields);

        res.status(200).json({ message: `List '${listName}' updated successfully.` });
    } catch (error) {
        console.error("Error updating list:", error);
        res.status(500).json({ error: 'Failed to update list.' });
    }
});
  
// Get a list by name
app.get('/api/secure/list/:listName', verifyToken, async (req, res) => {
    const { listName } = req.params;

    try {
        const doc = await db.collection('lists').doc(listName).get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'List not found.' });
        }

        // Ensure the list is accessible by the requesting user
        const listData = doc.data();
        if (listData.visibility === 'private' && listData.creatorId !== req.user.uid) {
            return res.status(403).json({ error: 'Access denied to private list.' });
        }

        res.json(listData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve list.' });
    }
});

// Delete a list
app.delete('/api/secure/list/:listName', verifyToken, async (req, res) => {
    const { listName } = req.params;

    try {
        const listRef = db.collection('lists').doc(listName);
        const doc = await listRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'List not found.' });
        }

        // Ensure the user is the creator of the list
        const listData = doc.data();
        if (listData.creatorId !== req.user.uid) {
            return res.status(403).json({ error: 'You do not have permission to delete this list.' });
        }

        await listRef.delete();
        res.status(200).json({ message: `List '${listName}' deleted successfully.` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete list.' });
    }
});

// Get all list names and details for the authenticated user
app.get('/api/secure/lists', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid; // Authenticated user's ID

        // Query lists where creatorId matches the logged-in user
        const snapshot = await db.collection('lists')
                                 .where('creatorId', '==', userId)
                                 .get();

        if (snapshot.empty) {
            return res.status(200).json([]); // Return an empty array if no lists are found
        }

        // Map each document to its data (including Firestore document ID)
        const userLists = snapshot.docs.map(doc => ({
            id: doc.id, // Firestore document ID
            ...doc.data() // All fields in the document
        }));

        res.status(200).json(userLists); // Return the lists
    } catch (error) {
        console.error("Error fetching lists:", error);
        res.status(500).json({ error: 'Failed to retrieve list names.' });
    }
});
  
// Get a list by name with detailed destination info
app.get('/api/secure/list/:listName/details', verifyToken, async (req, res) => {
    const { listName } = req.params;

    try {
        const doc = await db.collection('lists').doc(listName).get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'List not found.' });
        }

        const listData = doc.data();

        // Fetch detailed destination info for each customId in the destinations array
        const destinationsQuerySnapshot = await db.collection('destinations')
            .where('customId', 'in', listData.destinations)
            .get();

        const destinations = destinationsQuerySnapshot.docs.map((destDoc) => ({
            customId: destDoc.data().customId,
            ...destDoc.data(),
        }));

        // Debugging: Log the fetched destinations
        console.log('Fetched destinations:', destinations);

        res.json({
            ...listData,
            destinations,
        });
    } catch (error) {
        console.error('Error fetching list details:', error);
        res.status(500).json({ error: 'Failed to fetch list details.' });
    }
});

// Endpoint for guests to fetch the 10 most recent public lists
app.get("/api/open/public-lists", async (req, res) => {
    try {
        const snapshot = await db.collection("lists")
            .where("visibility", "==", true)
            .orderBy("lastModified", "desc")
            .limit(10) // Restrict to 10 most recent public lists
            .get();

        const publicLists = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(publicLists);
    } catch (error) {
        console.error("Error fetching public lists for guests:", error);
        res.status(500).json({ error: "Failed to fetch public lists." });
    }
});

// Endpoint for authenticated users to fetch all public lists
app.get("/api/secure/public-lists", async (req, res) => {
    try {
        const snapshot = await db.collection("lists")
            .where("visibility", "==", true)
            .orderBy("lastModified", "desc")
            .get();

        const publicLists = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(publicLists); // Return all public lists
    } catch (error) {
        console.error("Error fetching public lists for authenticated users:", error);
        res.status(500).json({ error: "Failed to fetch public lists." });
    }
});

// Endpoint for authenticated users to add a review to a list
app.post("/api/secure/lists/:id/review", async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 10) {
        return res.status(400).json({ error: "Rating must be a number between 1 and 10." });
    }

    try {
        const listRef = db.collection("lists").doc(id);

        // Fetch the current list data
        const listDoc = await listRef.get();
        if (!listDoc.exists) {
            return res.status(404).json({ error: "List not found." });
        }

        const newReview = {
            rating,
            comment: comment || "", // Default to an empty string if no comment provided
            hidden: false, // Default hidden flag
        };

        // Add the review to the list's reviews array
        await listRef.update({
            reviews: admin.firestore.FieldValue.arrayUnion(newReview),
        });

        res.json({ message: "Review added successfully." });
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ error: "Failed to add review." });
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
