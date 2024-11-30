import React, { useState, useEffect } from "react";
import './Lists.css';
import { searchDestinations, createList, updateList, getSecureLists, getSecureListDetails } from "../api";

function Lists() {
    // State variables for searching
    const [searchTerm, setSearchTerm] = useState("");
    const [searchType, setSearchType] = useState("");
    const [maxResults, setMaxResults] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    // State variables for list creation
    const [listName, setListName] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState("");
    const [selectedDestinations, setSelectedDestinations] = useState([]);

    // State variables for list viewing
    const [loading, setLoading] = useState(false);
    const [userLists, setUserLists] = useState([]);
    const [expandedLists, setExpandedLists] = useState([]);

    useEffect(() => {
        // Fetch the user's lists on component mount
        const fetchLists = async () => {
            const token = localStorage.getItem("authToken");
            if(!token) {
                console.error("User is not authenticated.");
                return;
            }
            try {
                const lists = await getSecureLists();
                console.log("Fetched Lists:", lists);
                setUserLists(lists); // Populate the user's lists
            } catch (error) {
                console.error("Failed to fetch user lists:", error.message);
            }
        };

        fetchLists();
    }, []);

    const fetchListDetails = async (listName) => {
        try {
            const response = await getSecureListDetails(listName); // Fetch detailed list info
            console.log("Fetched List Details:", response);
    
            if (response) {
                setExpandedLists((prevExpandedLists) => [...prevExpandedLists, response]); // Update expanded lists
            } else {
                console.error("Response for list details is null or undefined.");
            }
        } catch (error) {
            console.error("Error in fetchListDetails:", error.message);
            alert("Failed to fetch details for the list."); // This is currently triggering the alert
        }
    };
     
    const toggleListDetails = async (list) => {
        if (expandedLists.some((expanded) => expanded.name === list.name)) {
            // Collapse the list
            setExpandedLists((prev) => prev.filter((expanded) => expanded.name !== list.name));
        } else {
            try {
                await fetchListDetails(list.name); // Fetch details if not already expanded
            } catch (error) {
                console.error("Error toggling list details:", error.message);
            }
        }
    };     

    const handleSearch = async () => {
        // Ensure at least one search term or search type is provided
        if (!searchTerm.trim() && searchType === "") {
            alert("Please provide a search term or select a search type.");
            return;
        }
    
        try {
            setLoading(true);
    
            // Use defaults if no maxResults or searchType is selected
            const results = await searchDestinations(
                searchType || "all", // Default to "all" if no type is chosen
                searchTerm || "",    // Default to empty string for the pattern
                maxResults || 209    // Default to 209 if no maxResults is provided
            );
    
            setSearchResults(results);
        } catch (error) {
            console.error("Error fetching search results:", error.message);
            alert("Failed to fetch search results. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    

    const handleAddToSelection = (destination) => {
        if (!selectedDestinations.some((dest) => dest.customId === destination.customId)) {
            setSelectedDestinations([...selectedDestinations, destination]);
        }
    };

    const handleRemoveFromSelection = (customId) => {
        setSelectedDestinations(selectedDestinations.filter((dest) => dest.customId !== customId));
    };

    const handleCreateList = async () => {
        if (!listName.trim()) {
            alert("List name cannot be empty.");
            return;
        }

        if (selectedDestinations.length === 0) {
            alert("No destinations selected. Add destinations to your selection first.");
            return;
        }

        try {
            setLoading(true);

            // Step 1: Create an empty list
            await createList(listName, description, visibility);
            alert("Empty list created successfully.");

            // Step 2: Populate the list with destinations
            const destinationIds = selectedDestinations.map((dest) => dest.customId);
            await updateList(listName, destinationIds, visibility);
            alert("List updated successfully with destinations.");

            // Reset form
            setListName("");
            setDescription("");
            setVisibility("");
            setSelectedDestinations([]);

            // Refresh user lists
            const lists = await getSecureLists();
            setUserLists(lists);

        } catch (error) {
            console.error(error.message);
            alert("Failed to create or update the list.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lists-container">
            <h3>Search Destinations</h3>
            <div>
                <input
                    type="text"
                    placeholder="Enter search term"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                >
                    {searchType === "" && (
                        <option value="" disabled>
                            Choose Search Type
                        </option>
                    )}
                    <option value="Name">Name</option>
                    <option value="Country">Country</option>
                    <option value="Region">Region</option>
                </select>
                <select
                    value={maxResults}
                    onChange={(e) => setMaxResults(parseInt(e.target.value))}
                >
                    {maxResults === "" && (
                        <option value="" disabled>
                            Choose Number of Results
                        </option>
                    )}
                    {[1, 2, 5, 10, 20, 50, 100, 200].map((n) => (
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
                                <button onClick={() => handleAddToSelection(result)}>
                                    Add to Selection
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div>
                <h3>Create a List</h3>
                <input
                    type="text"
                    placeholder="List Name"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="List Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value === "Public")}
                >
                    {visibility === "" && (
                        <option value="" disabled>
                            Select Visibility
                        </option>
                    )}
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                </select>
                <button onClick={handleCreateList} disabled={loading}>
                    {loading ? "Creating..." : "Create List"}
                </button>
            </div>

            {selectedDestinations.length > 0 && (
                <div>
                    <h3>Selected Destinations</h3>
                    <ul>
                        {selectedDestinations.map((dest, index) => (
                            <li key={index}>
                                <strong>{dest.Destination}</strong> - {dest.Country} ({dest.Region})
                                <button onClick={() => handleRemoveFromSelection(dest.customId)}>
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {userLists.length > 0 && (
                <div>
                    <h3>Your Lists</h3>
                    {userLists.map((list, index) => (
                        <div key={index} style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
                            <p><strong>{list.name}</strong></p>
                            <button onClick={() => toggleListDetails(list)}>
                                {expandedLists.some((expanded) => expanded && expanded.name === list.name) ? "Hide Info" : "View Info"}
                            </button>
                            {expandedLists.some((expanded) => expanded.name === list.name) && (
                                <div>
                                    {/* Find the expanded list details */}
                                    {expandedLists
                                        .filter((expanded) => expanded && expanded.name === list.name)
                                        .map((expandedList) => (
                                            <div key={expandedList.name}>
                                                <p><strong>Description:</strong> {expandedList.description || "No description provided."}</p>
                                                <p><strong>Visibility:</strong> {expandedList.visibility ? "Public" : "Private"}</p>
                                                <p><strong>Destinations:</strong></p>
                                                <ul>
                                                    {expandedList.destinations.length > 0 ? (
                                                        expandedList.destinations.map((dest, idx) => (
                                                            <li key={idx}>
                                                                <strong>{dest.Destination}</strong> - {dest.Country}
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li>No destinations in this list.</li>
                                                    )}
                                                </ul>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Lists;
