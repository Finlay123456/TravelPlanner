import React from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";

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

    return (
        <div>
            <h2>Your Profile</h2>
            {user && (
                <>
                    <p><strong>Name:</strong> {user.displayName || "N/A"}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                </>
            )}
            <div>
                <button onClick={handleResetPassword}>Reset Password</button>
                <button onClick={() => navigate("/lists")}>Manage Your Lists</button>
                <button onClick={() => navigate("/public-lists")}>View Public Lists</button>
            </div>
        </div>
    );
}

export default Profile;
