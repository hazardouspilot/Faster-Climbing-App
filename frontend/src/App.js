import React, { useState, useEffect } from "react";
import "./App.css"; // Import CSS file for styling
import Login from "./components/Login";
import Register from "./components/Register";
import RoutesByLocation from "./components/RoutesByLocation";
import AddGyms from './components/AddGyms';
import { Routes, Route } from 'react-router-dom';
import Users from "./components/Users";

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  // Check if user is already logged in from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("userData");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("userData");
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowRegister(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("userData");
    setUser(null);
  };

  return (
    <div className="app-container">
      <header>
        <h1>My Climbing Logbook</h1>
        {user && (
          <div className="user-info">
            Welcome, {user.firstName || user.username}!
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </header>
      <main>
        {!user ? (
          <div className="auth-container">
            {showRegister ? (
              <>
                <Register />
                <p>
                  Already have an account?{" "}
                  <button onClick={() => setShowRegister(false)}>
                    Login instead
                  </button>
                </p>
              </>
            ) : (
              <>
                <Login onLoginSuccess={handleLoginSuccess} />
                <p>
                  Don't have an account?{" "}
                  <button onClick={() => setShowRegister(true)}>
                    Register instead
                  </button>
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="dashboard">
            <Routes>
              <Route path="/" element={<RoutesByLocation username={user.username} />} />
              <Route path="/users" element={<Users />} />
              <Route path="/add-gyms" element={<AddGyms username={user.username} />} />
            </Routes>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
