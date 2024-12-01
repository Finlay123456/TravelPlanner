const API_BASE_URL = "http://localhost:3000";

// Helper function to get the JWT token from localStorage
function getAuthToken() {
    return localStorage.getItem("authToken"); // Ensure authToken is stored upon login
}

// Helper function for API requests
async function apiRequest(endpoint, options = {}, isSecure = false) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (isSecure) {
        const token = getAuthToken();
        if (!token) throw new Error("User is not authenticated.");
        headers.Authorization = `Bearer ${token}`;
    }

    console.log("Sending request to:", `${API_BASE_URL}${endpoint}`);
    console.log("Request options:", { ...options, headers });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Error: ${response.status} - ${error}`);
    }

    return response.json();
}

/**
 * Public (Unauthenticated) Endpoints
 */
export async function getPublicDestinations() {
    return apiRequest("/api/open/destinations");
}

export async function searchDestinations({ name = "", country = "", region = "" }, maxResults = 209) {
    // Construct the query parameters dynamically
    const queryParams = new URLSearchParams({
        name: encodeURIComponent(name.trim()),
        country: encodeURIComponent(country.trim()),
        region: encodeURIComponent(region.trim()),
        n: maxResults.toString(),
    });

    return apiRequest(`/api/open/search?${queryParams.toString()}`);
}

export async function getSecureLists() {
    return apiRequest("/api/secure/lists", {}, true);
}

export async function getSecureListDetails(listName) {
    return apiRequest(`/api/secure/list/${listName}/details`, {}, true);
}

export async function getPublicListDetails(listId) {
    return apiRequest(`/api/open/list/${listId}`);
}

/**
 * Secure (Authenticated) Endpoints
 */
export async function createList(name, description, visibility) {
    return apiRequest(
        "/api/secure/list",
        {
            method: "POST",
            body: JSON.stringify({
                listName: name,
                visibility, // Pass boolean
                description, // Pass optional description
            }),
        },
        true // Requires authentication
    );
}


export async function updateList(name, destinations, visibility, description) {
    return apiRequest(
        `/api/secure/list/${name}`,
        {
            method: "PUT",
            body: JSON.stringify({
                destinations,
                visibility, // Pass boolean
                description,
            }),
        },
        true // Requires authentication
    );
}

export async function deleteList(listName) {
    return apiRequest(
        `/api/secure/list/${listName}`,
        {
            method: "DELETE",
        },
        true // Requires authentication
    );
}

export async function getGuestPublicLists() {
    return apiRequest("/api/open/public-lists");
}

export async function getAuthenticatedPublicLists() {
    return apiRequest("/api/secure/public-lists", {}, true);
}

export async function submitReview(listId, rating, comment = "") {
    return apiRequest(
        `/api/secure/lists/${listId}/review`,
        {
            method: "POST",
            body: JSON.stringify({ rating, comment }),
        },
        true // Requires authentication
    );
}


/**
 * Admin Endpoints
 */
export async function grantAdminPrivileges(email) {
    return apiRequest(
        `/api/admin/make-admin`,
        {
            method: "POST",
            body: JSON.stringify({ email }), // Pass email in the body
        },
        true // Admin-level endpoint
    );
}

export async function revokeAdminPrivileges(email) {
    return apiRequest(
        `/api/admin/remove-admin`,
        {
            method: "POST",
            body: JSON.stringify({ email }), // Pass email in the body
        },
        true // Admin-level endpoint
    );
}

export async function toggleReviewVisibility(listId, reviewIndex, hidden) {
    return apiRequest(
        `/api/admin/toggle-review-hidden`,
        {
            method: "POST",
            body: JSON.stringify({ listId, reviewIndex, hidden }),
        },
        true // Requires admin-level authentication
    );
}


export async function banUser(email) {
    return apiRequest(
        `/api/admin/ban-user`,
        {
            method: "POST",
            body: JSON.stringify({ email }), // Pass email in the body
        },
        true // Admin-level endpoint
    );
}

export async function unbanUser(email) {
    return apiRequest(
        `/api/admin/unban-user`,
        {
            method: "POST",
            body: JSON.stringify({ email }), // Pass email in the body
        },
        true // Admin-level endpoint
    );
}

// Fetch all users
export async function fetchAllUsers() {
    return apiRequest("/api/admin/users", {}, true); // Admin-level endpoint
}

export async function fetchAllReviews() {
    return apiRequest('/api/admin/reviews', {}, true); // Requires admin authentication
}

