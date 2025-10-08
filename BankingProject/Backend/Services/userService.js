import User from '../Models/user.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const generateToken =(newUser)=>{
    return jwt.sign( 
{id: newUser._id || newUser.id},process.env.JWT_SECRET, {expiresIn:'7d'} 
    );
}

export const signUpUser = async({username,email,password})=>{
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
        throw new Error('Database connection not available. Please try again later.');
    }

    // Check for existing user
    const existingUser = await User.findOne({$or:[{email},{username}]});
    if(existingUser){
        throw new Error('Username or email already in use');
    }
    
    // Create new user
    const newUser = new User({username,email,password});
    await newUser.save();
    const token = generateToken(newUser);
    return{
        newUser:{id: newUser._id,username:newUser.username,email:newUser.email},token
    };
}

export const LoginUser = async({email,password})=>{
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
        throw new Error('Database connection not available. Please try again later.');
    }

    // Find user by email
    const user = await User.findOne({email});
    if(!user){
        throw new Error('Invalid email');
    }
    
    // Verify password
    const pepper = process.env.PEPPER;
    const isMatch = await user.comparePasswords(password + pepper);
    if(!isMatch){
        throw new Error('Invalid password');
    }
    
    // Generate token and return user data
    const token = generateToken(user);
    return{
        newUser:{id: user._id, username: user.username, email: user.email},
        token
    };
};