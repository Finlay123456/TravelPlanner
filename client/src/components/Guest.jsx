import React from "react";
import { useNavigate } from "react-router-dom";
import GuestNavbar from "./GuestNavbar";

const Guest = () => {
    const navigate = useNavigate();

    return (
        <div>
            <GuestNavbar />
            <div className="guest-homepage">
                <h1>Welcome, Guest!</h1>
                <p>Explore public lists or search for exciting destinations.</p>
            </div>
        </div>
    );
};

export default Guest;
