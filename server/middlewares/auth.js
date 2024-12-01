const { getAuth } = require('firebase-admin/auth');

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from header

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }

  try {
    // Verify the token
    const decodedToken = await getAuth().verifyIdToken(token);

    // Attach user info and custom claims to the request
    req.user = {
      uid: decodedToken.uid,
      isAdmin: decodedToken.isAdmin || false, // Check if the user is an admin
    };

    next();
  } catch (error) {
    console.error("Error verifying token:", error); // Log the error for debugging
    res.status(401).json({ error: 'Unauthorized. Invalid token.' });
  }
};

module.exports = verifyToken;
