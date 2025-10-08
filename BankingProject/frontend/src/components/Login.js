import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validateInputs = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passRegex = /^.{8,}$/;
    if (!emailRegex.test(formData.email)) return 'Invalid email format';
    if (!passRegex.test(formData.password)) return 'Password must be at least 8 characters';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const res = await api.post('/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      setError('');
      navigate('/payments');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    }
  };

  const testConnection = async () => {
    try {
      setConnectionStatus('Testing connection...');
      const res = await api.get('/api/health');
      setConnectionStatus(`✅ ${res.data.msg} (${res.data.status})`);
    } catch (err) {
      setConnectionStatus(`❌ Connection failed: ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        required
        pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
        title="Standard email format"
      />
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Password"
        required
        minLength="8"
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Login</button>
      
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Connection Test</h3>
        <button type="button" onClick={testConnection} style={{ marginBottom: '10px' }}>
          Test Backend Connection
        </button>
        {connectionStatus && <p style={{ fontSize: '14px', margin: '5px 0' }}>{connectionStatus}</p>}
      </div>
    </form>
  );
};

export default Login;