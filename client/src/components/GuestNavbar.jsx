import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import './GuestNavbar.css';

function GuestNavbar() {
    const navigate = useNavigate();

    return (
        <nav className="navbar">
            <NavLink 
                to="/guest" 
                className={({ isActive }) => isActive ? "active" : ""}
            >
                Home Page
            </NavLink>
            <NavLink 
                to="/viewpublic" 
                className={({ isActive }) => isActive ? "active" : ""}
            >
                View Public Lists
            </NavLink>
            <NavLink 
                to="/searchpublic" 
                className={({ isActive }) => isActive ? "active" : ""}
            >
                Search Destinations
            </NavLink>
            <button 
                onClick={() => navigate("/")}
                className="login-button"
            >
                Login
            </button>
        </nav>
    );
}

export default GuestNavbar;
