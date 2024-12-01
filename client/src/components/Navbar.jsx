import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { AuthContext } from "../AuthProvider";

function Navbar() {
    const location = useLocation();
    const auth = getAuth();
    const user = auth.currentUser;
    const { isAdmin } = useContext(AuthContext);

    return (
        <div className="navbar">
            <Link
                to="/authenticated"
                className={location.pathname === "/authenticated" ? "active" : ""}
            >
                Home
            </Link>
            <Link
                to="/viewpublic"
                className={location.pathname === "/viewpublic" ? "active" : ""}
            >
                View Public Lists
            </Link>
            <Link
                to="/profile"
                className={location.pathname === "/profile" ? "active" : ""}
            >
                View Profile
            </Link>
            <Link
                to="/lists"
                className={location.pathname === "/lists" ? "active" : ""}
            >
                Manage Your Lists
            </Link>
            {isAdmin && (
                <Link
                    to="/admincontrol"
                    className={location.pathname === "/admincontrol" ? "active" : ""}
                >
                    Admin
                </Link>
            )}
        </div>
    );
}

export default Navbar;
