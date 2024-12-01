import React, { useState, useEffect } from "react";
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import SignUpForm from "./components/SignUpForm";
import LoginForm from "./components/LoginForm";
import Lists from "./components/Lists";
import Profile from "./components/Profile";
import AuthenticatedUser from "./components/AuthenticatedUser";
import ViewPublic from "./components/ViewPublic";
import SearchPublic from './components/SearchPublic';
import Guest from './components/Guest';
import AdminControl from './components/AdminControl';
import DMCA from './components/DMCA';

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
                <button onClick={() => {
                    localStorage.clear();
                    navigate("/guest");
                }
                    } className="button">
                    Continue as Guest
                </button>
                <button onClick={() => navigate("/policies")} className="button">
                    View Policies
                </button>
            </div>
        </div>
    );
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user); // Update the authentication state based on the user
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, [auth]);

    return (
        <Router>
            <div>
                <main>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/signup" element={<SignUpForm />} />
                        <Route path="/login" element={<LoginForm />} />
                        <Route 
                            path="/profile" 
                            element={isAuthenticated ? <Profile /> : <HomePage />} 
                        />
                        <Route 
                            path="/lists" 
                            element={isAuthenticated ? <Lists /> : <HomePage />} 
                        />
                        <Route 
                            path="/authenticated" 
                            element={isAuthenticated ? <AuthenticatedUser /> : <HomePage />} 
                        />
                        <Route path="/guest" element={<Guest />} />
                        <Route path="/viewpublic" element={<ViewPublic />}/>
                        <Route 
                            path="/searchpublic" 
                            element={<SearchPublic />} 
                        />
                        <Route path="/admincontrol" element={<AdminControl />} />
                        <Route path="/policies" element={<DMCA />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
