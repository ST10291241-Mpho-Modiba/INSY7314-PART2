import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Payments from './components/Payments';
import './App.css';  // Basic styles

function App() {
  const token = localStorage.getItem('token');
  return (
    <Router>
      <div className="App">
        <header>
          <h1>🔒 Secure International Payments Portal</h1>
          {!token && <nav><a href="/signup">Signup</a> | <a href="/">Login</a></nav>}
          {token && <nav><a href="/payments">Payments</a> | <button onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}>Logout</button></nav>}
        </header>
        <main>
          <Routes>
            <Route path="/" element={token ? <Navigate to="/payments" /> : <Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/payments" element={token ? <Payments /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;