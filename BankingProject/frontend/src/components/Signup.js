import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validateInputs = () => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!usernameRegex.test(formData.username)) return 'Username: 3-20 alphanumeric + underscore';
    if (!emailRegex.test(formData.email)) return 'Invalid email format';
    if (!passRegex.test(formData.password)) return 'Password: 1 lower, 1 upper, 1 digit, min 8 chars';
    // Exceeds: Password strength check
    const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])");
    if (!strongRegex.test(formData.password)) return 'Password needs a special char for extra security';
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
      const res = await api.post('/api/auth/signup', formData);
      localStorage.setItem('token', res.data.token);
      setError('');
      navigate('/payments');
    } catch (err) {
      if (err.response?.data?.errors) {
        // Handle validation errors from backend
        const errorMessages = err.response.data.errors.map(error => error.msg).join(', ');
        setError(errorMessages);
      } else {
        setError(err.response?.data?.msg || 'Signup failed');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Signup</h2>
      <input
        type="text"
        name="username"
        value={formData.username}
        onChange={handleChange}
        placeholder="Username"
        required
        pattern="[a-zA-Z0-9_]{3,20}"
        title="3-20 alphanumeric + underscore"
      />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        required
        pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
      />
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Strong Password"
        required
        minLength="8"
        pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}"
        title="1 lower, 1 upper, 1 digit, min 8"
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Signup</button>
    </form>
  );
};

export default Signup;