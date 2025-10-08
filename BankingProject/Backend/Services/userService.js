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
        // No database connection - create mock user for development
        const mockUser = {
            id: Date.now().toString(), // Simple ID generation
            username,
            email,
            password // In real app, this would be hashed
        };
        const token = generateToken(mockUser);
        return{
            newUser:{id: mockUser.id, username: mockUser.username, email: mockUser.email},
            token
        };
    }

    // Normal database operations when connected
    const existingUser = await User.findOne({$or:[{email},{username}]});
    if(existingUser){
        throw new Error('Username or email already in use');
    }
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
        // No database connection - create mock login for development
        // In development, accept any email/password combination
        const mockUser = {
            id: Date.now().toString(),
            username: email.split('@')[0], // Use email prefix as username
            email,
        };
        const token = generateToken(mockUser);
        return{
            newUser:{id: mockUser.id, username: mockUser.username, email: mockUser.email},
            token
        };
    }

    // Normal database operations when connected
    const user = await User.findOne({email});
    if(!user){
        throw new Error('Invaild email');
    }
    const pepper = process.env.PEPPER;
    //const isMatch = await bcrypt.compare(password + pepper, user.password);
    const isMatch = await user.comparePasswords(password+pepper
        
    );
    if(!isMatch){
        throw new Error('Invaild password');
    }
    const token = generateToken(user);
    return{
        newUser:{id: user._id, username: user.username, email: user.email}
        ,token};
};