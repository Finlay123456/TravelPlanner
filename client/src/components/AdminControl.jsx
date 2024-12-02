import React, { useState, useEffect, useContext } from "react";
import Navbar from "./Navbar";
import { AuthContext } from "../AuthProvider";
import {
    fetchAllReviews,
    fetchAllUsers,
    banUser,
    unbanUser,
    grantAdminPrivileges,
    revokeAdminPrivileges,
    toggleReviewVisibility,
} from "../api";

function AdminControl() {
    const { isAdmin } = useContext(AuthContext);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [reviewsError, setReviewsError] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const allUsers = await fetchAllUsers();
                setUsers(allUsers);
            } catch (err) {
                console.error("Error fetching users:", err);
                setError("Failed to fetch users.");
            } finally {
                setLoading(false);
            }
        };

        const fetchReviews = async () => {
            try {
                const allReviews = await fetchAllReviews();
                console.log(allReviews);
                setReviews(allReviews);
            } catch (err) {
                console.error("Error fetching reviews:", err);
                setReviewsError("Failed to fetch reviews.");
            } finally {
                setLoadingReviews(false);
            }
        };

        fetchReviews();
        fetchUsers();
    }, []);

    const handleBan = async (email) => {
        try {
            await banUser(email);
            alert(`User ${email} has been banned successfully.`);
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.email === email ? { ...user, disabled: true } : user
                )
            );
        } catch (err) {
            console.error("Error banning user:", err);
            alert("Failed to ban user.");
        }
    };
    
    const handleUnban = async (email) => {
        try {
            await unbanUser(email);
            alert(`User ${email} has been unbanned successfully.`);
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.email === email ? { ...user, disabled: false } : user
                )
            );
        } catch (err) {
            console.error("Error unbanning user:", err);
            alert("Failed to unban user.");
        }
    };

    const handleAdminToggle = async (email, isAdmin) => {
        try {
            if (isAdmin) {
                await revokeAdminPrivileges(email);
                alert(`User ${email} is no longer an admin.`);
            } else {
                await grantAdminPrivileges(email);
                alert(`User ${email} is now an admin.`);
            }
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.email === email ? { ...user, isAdmin: !isAdmin } : user
                )
            );
        } catch (err) {
            console.error("Error toggling admin privileges:", err);
            alert("Failed to toggle admin privileges.");
        }
    };

    const handleToggleVisibility = async (listId, reviewIndex, hidden) => {
        try {
            await toggleReviewVisibility(listId, reviewIndex, !hidden);
            alert(`Review has been ${!hidden ? "hidden" : "unhidden"}.`);
            setReviews((prevReviews) =>
                prevReviews.map((review, index) =>
                    index === reviewIndex ? { ...review, hidden: !hidden } : review
                )
            );
        } catch (err) {
            console.error("Error toggling review visibility:", err);
            alert("Failed to toggle review visibility.");
        }
    };    
    

    if (!isAdmin) {
        return (
            <div>
                <Navbar />
                <h1>Access Denied</h1>
                <p>You do not have permission to access this page.</p>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <h1>Admin Control Panel</h1>
            <p>Welcome, Admin! Use this panel to manage users and privileges.</p>
            {loading ? (
                <p>Loading users...</p>
            ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Display Name</th>
                            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Email</th>
                            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Status</th>
                            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.email}> {/* Ensure the key is unique */}
                                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                                    {user.displayName || "Anonymous"}
                                </td>
                                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{user.email}</td>
                                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                                    {user.disabled ? "Banned" : user.isAdmin ? "Admin" : "Active"}
                                </td>
                                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                                    <button
                                        onClick={() => (user.disabled ? handleUnban(user.email) : handleBan(user.email))}
                                        style={{
                                            marginRight: "10px",
                                            backgroundColor: user.disabled ? "#4CAF50" : "#f44336",
                                            color: "white",
                                            border: "none",
                                            padding: "5px 10px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {user.disabled ? "Unban" : "Ban"}
                                    </button>

                                    <button
                                        onClick={() => handleAdminToggle(user.email, user.isAdmin)}
                                        style={{
                                            backgroundColor: user.isAdmin ? "#f44336" : "#008CBA",
                                            color: "white",
                                            border: "none",
                                            padding: "5px 10px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {user.isAdmin ? "Remove Admin" : "Make Admin"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            )}

            <h2>Manage Reviews</h2>
            {loadingReviews ? (
                <p>Loading reviews...</p>
            ) : reviewsError ? (
                <p style={{ color: "red" }}>{reviewsError}</p>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ border: "1px solid #ccc", padding: "8px" }}>List Name</th>
                            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Rating</th>
                            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Comment</th>
                            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Status</th>
                            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.map((review) => (
                            <tr key={review.id}>
                                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                                    {review.listName || "Unknown"}
                                </td>
                                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                                    {review.rating}/10
                                </td>
                                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                                    {review.comment || "No comment provided."}
                                </td>
                                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                                    {review.hidden ? "Hidden" : "Visible"}
                                </td>
                                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                                <button
                                    onClick={() => handleToggleVisibility(review.listId, review.reviewIndex, review.hidden)}
                                    style={{
                                        backgroundColor: review.hidden ? "#4CAF50" : "#f44336",
                                        color: "white",
                                        border: "none",
                                        padding: "5px 10px",
                                        cursor: "pointer",
                                    }}
                                >
                                    {review.hidden ? "Unhide" : "Hide"}
                                </button>

                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AdminControl;
