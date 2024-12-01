import React from "react";
import { getAuth, sendPasswordResetEmail, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

function Profile() {
    const auth = getAuth();
    const user = auth.currentUser;
    const navigate = useNavigate();

    const handleResetPassword = async () => {
        if (user && user.email) {
            await sendPasswordResetEmail(auth, user.email);
            alert("Password reset email sent.");
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth); // Logs the user out
            localStorage.clear();
            navigate("/"); // Redirect to the home page (App.jsx)
        } catch (error) {
            console.error("Error logging out:", error);
            alert("Failed to log out. Please try again.");
        }
    };

    return (
        <div>
            <Navbar />
            <h2>Your Profile</h2>
            {user && (
                <>
                    <p><strong>Name:</strong> {user.displayName || "N/A"}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                </>
            )}
            <div>
                <button onClick={handleResetPassword}>Reset Password</button>
                <button onClick={() => navigate("/public-lists")}>View Public Lists</button>
                <button onClick={handleLogout}>Log Out</button>
            </div>
        </div>
    );
}

export default Profile;
