import React from "react";
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import SignUpForm from "./components/SignUpForm";
import LoginForm from "./components/LoginForm";
import Destinations from "./components/Destinations";
import Lists from "./components/Lists";
import Profile from "./components/Profile";

function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="homepage">
            <h1>Welcome to Travel Planner!</h1>
            <p>
                Your one-stop platform to explore exciting destinations, create personalized lists, 
                and plan your trips effortlessly. Sign up or log in to get started, or continue as 
                a guest to explore public destinations.
            </p>
            <div className="homepage-buttons">
                <button onClick={() => navigate("/login")} className="button">
                    Log In
                </button>
                <button onClick={() => navigate("/signup")} className="button">
                    Sign Up
                </button>
                <button onClick={() => navigate("/destinations")} className="button">
                    Continue as Guest
                </button>
            </div>
        </div>
    );
}

function App() {
    return (
        <Router>
            <div>
                <main>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/signup" element={<SignUpForm />} />
                        <Route path="/login" element={<LoginForm />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/lists" element={<Lists />} />
                        <Route path="/destinations" element={<Destinations />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
