import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import SignupForm from "./components/SignupForm";
import LoginForm from "./components/LoginForm";
import ListManager from "./components/ListManager";
import Destinations from "./components/Destinations";

function App() {
    return (
        <Router>
            {/* Keep consistent page layout */}
            <div>
                <header>
                    <nav>
                        <Link to="/">Home</Link> | 
                        <Link to="/signup">Sign Up</Link> | 
                        <Link to="/login">Log In</Link> | 
                        <Link to="/lists">Lists</Link> | 
                        <Link to="/destinations">Destinations</Link>
                    </nav>
                </header>
                <main>
                    <Routes>
                        <Route path="/" element={<h1>Welcome to the App!</h1>} />
                        <Route path="/signup" element={<SignupForm />} />
                        <Route path="/login" element={<LoginForm />} />
                        <Route path="/lists" element={<ListManager />} />
                        <Route path="/destinations" element={<Destinations />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
