import React from 'react';
import './App.css';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>AICyber Platform</h1>
        <p>AI-Powered Cybersecurity Platform</p>
      </header>
      <main>
        <Dashboard />
      </main>
    </div>
  );
}

export default App; 