import express from 'express'
import { signUpUser,LoginUser } from '../Services/userService.js';

export const signUp = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const result = await signUpUser({ username, email, password });
    res.status(201).json({
      msg: 'User registered successfully',
      token: result.token,
      user: result.newUser
    });
  } catch (err) {
    res.status(400).json({ msg: err.message });
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
    res.status(400).json({ msg: err.message });
  }
};