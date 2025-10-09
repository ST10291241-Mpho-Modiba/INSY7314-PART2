import express from 'express'
import { signUpUser,LoginUser, checkUsernameAvailability, checkEmailAvailability } from '../Services/userService.js';

export const signUp = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    const result = await signUpUser({ username, email, password, firstName, lastName });
    res.status(201).json({
      msg: 'User registered successfully',
      token: result.token,
      user: result.newUser
    });
  } catch (err) {
    // Provide more specific error messages
    let statusCode = 400;
    let errorMessage = err.message;

    if (err.message.includes('Username or email already in use')) {
      errorMessage = 'This username or email is already registered. Please try a different one.';
    } else if (err.message.includes('Database connection')) {
      statusCode = 503;
      errorMessage = 'Service temporarily unavailable. Please try again later.';
    } else if (err.message.includes('validation')) {
      errorMessage = 'Please check your input and try again.';
    }

    res.status(statusCode).json({ msg: errorMessage });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await LoginUser({ email, password });
    res.status(200).json({
      msg: 'Login successful',
      token: result.token,
      user: result.newUser
    });
  } catch (err) {
    // Provide more specific error messages
    let statusCode = 400;
    let errorMessage = err.message;

    if (err.message.includes('Invalid email')) {
      errorMessage = 'No account found with this email address.';
    } else if (err.message.includes('Invalid password')) {
      errorMessage = 'Incorrect password. Please try again.';
    } else if (err.message.includes('Database connection')) {
      statusCode = 503;
      errorMessage = 'Service temporarily unavailable. Please try again later.';
    } else if (err.message.includes('validation')) {
      errorMessage = 'Please check your email and password.';
    }

    res.status(statusCode).json({ msg: errorMessage });
  }
};

export const checkUsername = async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ 
        msg: 'Username is required',
        available: false 
      });
    }

    // Basic username validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
        msg: 'Username must be 3-20 characters (letters, numbers, underscore only)',
        available: false 
      });
    }

    const result = await checkUsernameAvailability(username);
    res.status(200).json({
      msg: result.available ? 'Username is available' : 'Username is already taken',
      available: result.available
    });
  } catch (err) {
    res.status(500).json({ 
      msg: 'Error checking username availability',
      available: false 
    });
  }
};

export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        msg: 'Email is required',
        available: false 
      });
    }

    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        msg: 'Please enter a valid email address',
        available: false 
      });
    }

    const result = await checkEmailAvailability(email);
    res.status(200).json({
      msg: result.available ? 'Email is available' : 'Email is already registered',
      available: result.available
    });
  } catch (err) {
    res.status(500).json({ 
      msg: 'Error checking email availability',
      available: false 
    });
  }
};