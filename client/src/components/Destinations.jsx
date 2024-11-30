import React, { useEffect, useState } from "react";
import { getPublicDestinations } from "../api"; // Import the API function

function Destinations() {
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDestinations = async () => {
            setLoading(true); // Start loading
            setError(""); // Reset error
            try {
                const destinationsArray = await getPublicDestinations();
                setDestinations(destinationsArray);
            } catch (err) {
                console.error("Error fetching destinations:", err.message);
                setError("Failed to load destinations. Please try again later.");
            } finally {
                setLoading(false); // End loading
            }
        };

        fetchDestinations();
    }, []);

    return (
        <div>
            <h2>Destinations</h2>
            {loading && <p>Loading destinations...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            <ul>
                {destinations.map((destination, index) => (
                    <li key={index}>
                        <strong>{destination.Destination}</strong> - {destination.Country}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Destinations;
