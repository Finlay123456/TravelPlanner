// LoginForm.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
    
        try {
            // Sign in the user
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
    
            // Get the user's details from Firebase Authentication
            const idTokenResult = await user.getIdTokenResult();
            const claims = idTokenResult.claims;
    
            // Check if the user is disabled
            if (claims.disabled) {
                // Show a user-friendly message
                alert("Your account has been disabled. Please contact the site administrator for assistance.");
                await auth.signOut(); // Immediately sign out the user
                return;
            }
    
            // Store the JWT token
            const token = idTokenResult.token;
            localStorage.setItem("authToken", token);
    
            navigate("/authenticated");
        } catch (error) {
            // Handle Firebase Authentication errors
            console.error("Error logging in:", error.message);
            if (error.code === "auth/user-disabled") {
                alert("Your account has been disabled. Please contact the site administrator.");
            } else {
                alert("Login failed. Please check your email and password.");
            }
        } finally {
            setLoading(false);
        }
    };
    
      

    return (
        <div>
            <h2>Login</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <form onSubmit={handleLogin}>
                <div>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? "Logging In..." : "Login"}
                </button>
                <button onClick={() => navigate("/")} className="back-button">
                    Back
                </button>
            </form>
        </div>
    );
}

export default LoginForm;
