// Import required libraries
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');
const { auth } = require('./firebase');
const verifyToken = require('./middlewares/auth');
const adminAuth = require('./firebase-admin').auth;

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Define routes
app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.get('/api/protected', verifyToken, (req, res) => {
    res.status(200).json({ message: 'Welcome to the protected route!', user: req.user });
})

// Route for user creation using firebase authentication
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);

      res.status(201).json({ message: 'User created successfully. Verification email sent.', user: { uid: user.uid, email: user.email } });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password} = req.body;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        if(!user.emailVerified) {
            return res.status(403).json({ error: 'Please verify your email before logging in.' });
        }

        //Generate a custom token for the user
        const token = await user.getIdToken();

        res.status(200).json({ message: 'Login successful', user: { uid: user.uid, email: user.email }, token });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

app.post('/api/make-admin', verifyToken, async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await adminAuth.getUserByEmail(email);
      await adminAuth.setCustomUserClaims(user.uid, { admin: true });
      res.status(200).json({ message: `${email} is now an admin.` });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
});

app.get('/api/admin', verifyToken, async (req, res) => {
    if (!req.user.admin) {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
  
    res.status(200).json({ message: 'Welcome, Admin!' });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
