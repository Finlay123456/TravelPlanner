import React, { useState, useEffect } from "react";
import './Lists.css';
import { searchDestinations, createList, updateList, getSecureLists, getSecureListDetails, deleteList } from "../api";
import Navbar from "./Navbar";

function Lists() {
    // State variables for searching
    const [name, setName] = useState("");
    const [country, setCountry] = useState("");
    const [region, setRegion] = useState("");
    const [maxResults, setMaxResults] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [expandedDestinations, setExpandedDestinations] = useState([]);

    // State variables for list creation
    const [listName, setListName] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState("");
    const [selectedDestinations, setSelectedDestinations] = useState([]);

    // State variables for list viewing
    const [loading, setLoading] = useState(false);
    const [userLists, setUserLists] = useState([]);
    const [expandedLists, setExpandedLists] = useState([]);

    // State variables for list editing
    const [isEditing, setIsEditing] = useState(false);
    const [editingListName, setEditingListName] = useState("");

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

    const handleAddToSelection = (destination) => {
        if (!selectedDestinations.some((dest) => dest.customId === destination.customId)) {
            setSelectedDestinations([...selectedDestinations, destination]);
        }
    };

    const handleRemoveFromSelection = (customId) => {
        setSelectedDestinations(selectedDestinations.filter((dest) => dest.customId !== customId));
    };

    const handleCreateOrUpdateList = async () => {
        if (userLists.length >= 20 && !isEditing) {
            alert("You have reached the maximum limit of 20 lists. Please delete an existing list to create a new one.");
            return;
        }
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
    
            const destinationIds = selectedDestinations
                .filter((dest) => dest && dest.customId) // Ensure valid destinations
                .map((dest) => dest.customId);
    
            if (isEditing) {
                // Update existing list
                await updateList(editingListName, destinationIds, visibility, description);
                alert(`List "${editingListName}" updated successfully.`);
            } else {
                // Create a new list
                await createList(listName, description, visibility);
                await updateList(listName, destinationIds, visibility);
                alert(`List "${listName}" created successfully.`);
            }
    
            // Reset form
            setListName("");
            setDescription("");
            setVisibility("");
            setSelectedDestinations([]);
            setIsEditing(false);
            setEditingListName("");
    
            // Refresh user lists
            const lists = await getSecureLists();
            setUserLists(lists);
        } catch (error) {
            console.error(error.message);
            alert(`Failed to ${isEditing ? "update" : "create"} the list.`);
        } finally {
            setLoading(false);
        }
    };    

    const handleEditList = async (list) => {
        try {
            // Fetch detailed list data if not already available
            const listDetails = await getSecureListDetails(list.name);
    
            // Populate the fields with the list data
            setListName(listDetails.name);
            setDescription(listDetails.description || "");
            setVisibility(listDetails.visibility);
            setSelectedDestinations(
                listDetails.destinations.map((dest) => ({
                    ...dest,
                    customId: dest.customId || "",
                    Destination: dest.Destination || "",
                    Country: dest.Country || "",
                    Region: dest.Region || "",
                })) // Ensure all fields are properly structured
            );
    
            setIsEditing(true); // Set editing mode to true
            setEditingListName(listDetails.name); // Track the name of the list being edited
            alert(`You are now editing the list "${listDetails.name}".`);
        } catch (error) {
            console.error("Error fetching list details for editing:", error.message);
            alert("Failed to load list details for editing. Please try again.");
        }
    };
    
    
    const handleDeleteList = async (listName) => {
        const confirmation = window.confirm(`Are you sure you want to delete the list "${listName}"?`);
        if (!confirmation) return;
    
        try {
            setLoading(true);
            await deleteList(listName); // Call the API to delete the list
            alert(`List "${listName}" has been deleted.`);
    
            // Refresh user lists
            const lists = await getSecureLists();
            setUserLists(lists);
        } catch (error) {
            console.error("Error deleting list:", error.message);
            alert("Failed to delete the list. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div>
            <Navbar />
            <div className="lists-container">
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
                                        onClick={() => handleAddToSelection(result)}
                                        style={{ marginLeft: "10px" }}
                                    >
                                        Add to Selection
                                    </button>
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
                <div>
                    <h3>{isEditing ? "Edit List" : "Create a List"}</h3>
                    <input
                        type="text"
                        placeholder="List Name"
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                        disabled={isEditing} // Disable editing of the list name during update
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
                    <button onClick={handleCreateOrUpdateList} disabled={loading}>
                        {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update List" : "Create List")}
                    </button>
                    {isEditing && (
                        <button
                            onClick={() => {
                                // Cancel editing
                                setIsEditing(false);
                                setEditingListName("");
                                setListName("");
                                setDescription("");
                                setVisibility("");
                                setSelectedDestinations([]);
                            }}
                            style={{ marginLeft: "10px" }}
                        >
                            Cancel Edit
                        </button>
                    )}
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
                                <button onClick={() => handleEditList(list)} style={{ marginLeft: "10px" }}>
                                    Edit
                                </button>
                                <button onClick={() => handleDeleteList(list.name)} style={{ marginLeft: "10px" }}>
                                    Delete
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
        </div>
    );
}

export default Lists;
