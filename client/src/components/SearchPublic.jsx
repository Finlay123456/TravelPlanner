import React, { useState } from "react";
import GuestNavbar from "./GuestNavbar";
import { searchDestinations } from "../api";

const SearchPublic = () => {
    // State variables for searching
    const [name, setName] = useState("");
    const [country, setCountry] = useState("");
    const [region, setRegion] = useState("");
    const [maxResults, setMaxResults] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [expandedDestinations, setExpandedDestinations] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        try {
            setLoading(true);

            // Default to empty values if no input is provided
            const results = await searchDestinations(
                { 
                    name: name || "", 
                    country: country || "", 
                    region: region || "" 
                },
                maxResults || 209 // Default to 209 if maxResults is not specified
            );

            setSearchResults(results);
        } catch (error) {
            console.error("Error fetching search results:", error.message);
            alert("Failed to fetch search results. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const toggleDestinationInfo = (destination) => {
        if (expandedDestinations.some((dest) => dest.customId === destination.customId)) {
            setExpandedDestinations(
                expandedDestinations.filter((dest) => dest.customId !== destination.customId)
            );
        } else {
            setExpandedDestinations([...expandedDestinations, destination]);
        }
    };  

    const searchOnDuckDuckGo = (query) => {
        const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        window.open(url, "_blank");
    };

    return (
        <div>
            <GuestNavbar />
            <div className="search-public">
            <h3>Search Destinations</h3>
                <div>
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Region"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                    />
                    <select
                        value={maxResults}
                        onChange={(e) => setMaxResults(parseInt(e.target.value))}
                    >
                        {maxResults === "" && (
                            <option value="" disabled>
                                Choose Number of Results
                            </option>
                        )}
                        {[1, 2, 5, 10, 20, 50, 100, 200, 500].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                    <button onClick={handleSearch} disabled={loading}>
                        {loading ? "Searching..." : "Search"}
                    </button>
                </div>

                {searchResults.length > 0 && (
                    <div>
                        <h3>Search Results</h3>
                        <ul>
                            {searchResults.map((result, index) => (
                                <li key={index}>
                                    <strong>{result.Destination}</strong> - {result.Country} ({result.Region})
                                    <button
                                        onClick={() => toggleDestinationInfo(result)}
                                        style={{ marginLeft: "10px" }}
                                    >
                                        {expandedDestinations.some((dest) => dest.customId === result.customId)
                                            ? "Hide Info"
                                            : "View Info"}
                                    </button>
                                    <button
                                        onClick={() => searchOnDuckDuckGo(result.Destination)}
                                        style={{ marginLeft: "10px" }}
                                    >
                                        Search DDG
                                    </button>
                                    {/* Expanded Destination Details */}
                                    {expandedDestinations.some(
                                        (dest) => dest.customId === result.customId
                                    ) && (
                                        <div style={{ marginTop: "10px", paddingLeft: "20px", border: "1px solid #ccc" }}>
                                            <p><strong>Destination:</strong> {result.Destination}</p>
                                            <p><strong>Country:</strong> {result.Country}</p>
                                            <p><strong>Region:</strong> {result.Region}</p>
                                            <p><strong>Latitude:</strong> {result.Latitude}</p>
                                            <p><strong>Longitude:</strong> {result.Longitude}</p>
                                            <p><strong>Description:</strong> {result.Description}</p>
                                            <p><strong>Category:</strong> {result.Category}</p>
                                            <p><strong>Currency:</strong> {result.Currency}</p>
                                            <p><strong>Approximate Annual Tourists:</strong> {result["Approximate Annual Tourists"]}</p>
                                            <p><strong>Best Time to Visit:</strong> {result["Best Time to Visit"]}</p>
                                            <p><strong>Cultural Significance:</strong> {result["Cultural Significance"]}</p>
                                            <p><strong>Famous Foods:</strong> {result["Famous Foods"]}</p>
                                            <p><strong>Language:</strong> {result.Language}</p>
                                            <p><strong>Majority Religion:</strong> {result["Majority Religion"]}</p>
                                            <p><strong>Safety:</strong> {result.Safety}</p>
                                            <p><strong>Cost of Living:</strong> {result["Cost of Living"]}</p>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPublic;
