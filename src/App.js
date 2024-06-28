// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Transfer from './pages/Transfer';
import Blint from './pages/Blint';
import Blap from './pages/Blap';
import Profile from './pages/Profile';
import Navbar from './components/Navbar'; // Import Navbar
import './styles/App.css';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar /> {/* Add Navbar here */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/blint" element={<Blint />} />
          <Route path="/blap" element={<Blap />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
