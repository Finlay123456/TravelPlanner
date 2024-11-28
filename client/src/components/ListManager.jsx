import React, { useState, useEffect } from "react";
import { createList, getLists } from "../api";

function ListManager() {
    const [listName, setListName] = useState("");
    const [lists, setLists] = useState([]);

    useEffect(() => {
        const fetchLists = async () => {
            const response = await getLists();
            setLists(response);
        };
        fetchLists();
    }, []);

    const handleCreateList = async () => {
        const response = await createList(listName);
        alert(response.message || response.error);
        setListName("");
        setLists([...lists, listName]);
    };

    return (
        <div>
            <h2>Manage Lists</h2>
            <input type="text" placeholder="List Name" value={listName} onChange={(e) => setListName(e.target.value)} />
            <button onClick={handleCreateList}>Create List</button>
            <h3>Your Lists</h3>
            <ul>
                {lists.map((list) => (
                    <li key={list}>{list}</li>
                ))}
            </ul>
        </div>
    );
}

export default ListManager;
