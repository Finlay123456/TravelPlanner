import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Navbar from "./Navbar";
import GuestNavbar from "./GuestNavbar";
import { submitReview, getAuthenticatedPublicLists, getGuestPublicLists } from "../api";

function ViewPublic() {
    const auth = getAuth();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [publicLists, setPublicLists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            const userIsAuthenticated = !!user;
            setIsAuthenticated(userIsAuthenticated);

            try {
                const lists = userIsAuthenticated
                    ? await getAuthenticatedPublicLists()
                    : await getGuestPublicLists();
                // Initialize `rating` and `comment` for each list
                const updatedLists = lists.map((list) => ({
                    ...list,
                    rating: "",
                    comment: "",
                }));
                setPublicLists(updatedLists);
            } catch (error) {
                console.error("Error fetching public lists:", error);
                alert("Failed to fetch public lists.");
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe(); // Cleanup the listener on component unmount
    }, [auth]);

    const handleAddReview = async (listId) => {
        const listIndex = publicLists.findIndex((list) => list.id === listId);
        if (listIndex === -1) return;

        const { rating, comment } = publicLists[listIndex];

        if (!rating || rating < 1 || rating > 10) {
            alert("Please provide a rating between 1 and 10.");
            return;
        }

        try {
            await submitReview(listId, rating, comment);
            alert("Review added successfully.");
            // Refresh the lists after a successful review
            const lists = isAuthenticated
                ? await getAuthenticatedPublicLists()
                : await getGuestPublicLists();
            const updatedLists = lists.map((list) => ({
                ...list,
                rating: "",
                comment: "",
            }));
            setPublicLists(updatedLists);
        } catch (error) {
            console.error("Error adding review:", error);
            alert("Failed to add review.");
        }
    };

    const handleInputChange = (listId, field, value) => {
        setPublicLists((prevLists) =>
            prevLists.map((list) =>
                list.id === listId ? { ...list, [field]: value } : list
            )
        );
    };

    return (
        <div>
            {isAuthenticated ? <Navbar /> : <GuestNavbar />}
            <h2>Public Lists</h2>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div>
                    {publicLists.length > 0 ? (
                        publicLists.map((list) => (
                            <div
                                key={list.id}
                                style={{
                                    border: "1px solid #ccc",
                                    margin: "10px",
                                    padding: "10px",
                                }}
                            >
                                <h3>{list.name}</h3>
                                <p>
                                    <strong>Description:</strong>{" "}
                                    {list.description || "No description provided."}
                                </p>
                                <p>
                                    <strong>Created By:</strong>{" "}
                                    {list.displayName || "Anonymous"}
                                </p>
                                <p>
                                    <strong>Reviews:</strong>
                                </p>
                                <ul>
                                {list.reviews
                                    ?.filter((review) => !review.hidden).length > 0 ? ( // Check for non-hidden reviews first
                                    list.reviews
                                        .filter((review) => !review.hidden) // Filter out hidden reviews
                                        .map((review, index) => (
                                            <li key={index}>
                                                <strong>Rating:</strong> {review.rating}/10
                                                {review.comment && (
                                                    <>
                                                        {" "}
                                                        <strong>Comment:</strong> {review.comment}
                                                    </>
                                                )}
                                            </li>
                                        ))
                                ) : (
                                    <li>No reviews yet.</li>
                                )}

                                </ul>
                                {isAuthenticated && (
                                    <div>
                                        <h4>Add a Review</h4>
                                        <select
                                            value={list.rating}
                                            onChange={(e) =>
                                                handleInputChange(list.id, "rating", e.target.value)
                                            }
                                        >
                                            <option value="">Select Rating</option>
                                            {[...Array(10).keys()].map((num) => (
                                                <option key={num + 1} value={num + 1}>
                                                    {num + 1}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Comment (optional)"
                                            value={list.comment}
                                            onChange={(e) =>
                                                handleInputChange(list.id, "comment", e.target.value)
                                            }
                                        />
                                        <button onClick={() => handleAddReview(list.id)}>
                                            Submit Review
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>No public lists available.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default ViewPublic;
