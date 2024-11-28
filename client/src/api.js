// src/api.js
const API_BASE_URL = "http://localhost:3000";

export async function signup(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    return response.json();
}

export async function login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    return response.json();
}

export async function getCountries() {
    const response = await fetch(`${API_BASE_URL}/countries`);
    return response.json();
}

export async function createList(listName) {
    const response = await fetch(`${API_BASE_URL}/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listName }),
    });
    return response.json();
}

export async function getLists() {
    const response = await fetch(`${API_BASE_URL}/lists`);
    return response.json();
}
