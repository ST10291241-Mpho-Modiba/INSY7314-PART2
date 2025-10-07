import User from '../Models/user.js';
import jwt from 'jsonwebtoken';

const generateToken =(newUser)=>{
    return jwt.sign( 
{id: newUser._id},process.env.JWT_SECRET, {expiresIn:'7d'} 
    );
}
export const signUpUser = async({username,email,password})=>{
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