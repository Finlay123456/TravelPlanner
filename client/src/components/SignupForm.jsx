// SignUpForm.jsx
import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function SignUpForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showNameField, setShowNameField] = useState(false);
    const navigate = useNavigate();

    const handleEmailPasswordSubmit = (e) => {
        e.preventDefault();
        if(email.trim() && password.trim()) {
            setShowNameField(true);
        } else {
            alert("Please fill in both email and password.");
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        const auth = getAuth();

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if(name.trim()) {
                await updateProfile(user, {displayName: name});
            }

            // Send email verification
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
            {!showNameField ? (
            <form onSubmit={handleEmailPasswordSubmit}>
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
                <button type="submit">Next</button>
            </form>
        ) : (
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
                <button type="submit" disabled={loading}>
                    {loading ? "Signing Up..." : "Sign Up"}
                </button>
            </form>
        )}
    </div>
    );
}

export default SignUpForm;
