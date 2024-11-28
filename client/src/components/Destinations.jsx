import React, { useEffect, useState } from "react";
import { getCountries } from "../api";

function Destinations() {
    const [countries, setCountries] = useState([]);

    useEffect(() => {
        const fetchCountries = async () => {
            const response = await getCountries();
            setCountries(response);
        };
        fetchCountries();
    }, []);

    return (
        <div>
            <h2>Available Destinations</h2>
            <ul>
                {countries.map((country, index) => (
                    <li key={index}>{country}</li>
                ))}
            </ul>
        </div>
    );
}

export default Destinations;
