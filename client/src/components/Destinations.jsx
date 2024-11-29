import React, { useEffect, useState } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase'; // Import Firestore instance

function Destinations() {
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    const fetchDestinations = async () => {
      const querySnapshot = await getDocs(collection(db, 'destinations'));
      const destinationsArray = querySnapshot.docs.map((doc) => doc.data());
      setDestinations(destinationsArray);
    };
    
    fetchDestinations();
  }, []);

  return (
    <div>
      <h2>Destinations</h2>
      <ul>
        {destinations.map((destination, index) => (
          <li key={index}>
            {destination.destination} - {destination.Country}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Destinations;
