import React from 'react'
import './App.css'

const App = () => {
  const testAPI = async () => {
    const response = await fetch('/api');
    const data = await response.text();
    alert(data);
  };

  return (
    <div>
      <h1>React Frontend</h1>
      <button onClick={testAPI}>Test API</button>
    </div>
  );
};

export default App;
