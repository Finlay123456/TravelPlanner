import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

function AuthenticatedUser() {
    const navigate = useNavigate();

    return (
        <div>
            <Navbar />
            <div className="authenticated-user">
                <h1>Welcome Back!</h1>
            </div>
        </div>
    );
}

export default AuthenticatedUser;
