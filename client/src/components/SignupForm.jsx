import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function SignUpForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Helper function to validate email format
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format validation
        return emailRegex.test(email);
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError(""); // Clear any previous errors

        if (!name.trim() || !email.trim() || !password.trim()) {
            setError("All fields are required.");
            return;
        }

        if (!isValidEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);
        const auth = getAuth();

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: name });
            await sendEmailVerification(user);

            alert("Sign-up successful. Please check your email to verify it before logging in.");
            navigate("/login");
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Sign Up</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <form onSubmit={handleSignUp}>
                <div>
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
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
                    {loading ? "Signing Up..." : "Sign Up"}
                </button>
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="back-button"
                >
                    Back
                </button>
            </form>
        </div>
    );
}

export default SignUpForm;
