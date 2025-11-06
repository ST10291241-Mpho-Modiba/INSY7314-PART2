import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
dotenv.config(); 

const userSchema = new mongoose.Schema({
  username: {
     type: String,
      required: true, 
      unique: true,
    match:[/^[a-zA-Z0-9_]+$/,'Username can only contain letters, numbers, and underscores.'],
 },
  email: { 
    type: String, 
    required: true,
     unique: true,
    match:[/.+@.+\..+/,'Please fill in a vaild email.']
 },
  password: { 
    type: String,
     required: true,
    minLength: 6,
   },
  role: {
    type: String,
    enum: ['user', 'employee'],
    default: 'user'
  }
},{timestamps: true});
//Hashing the passwrod before saving it 
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) 
    return next();
  
  try{
  const salt = await bcrypt.genSalt(12);  // Higher rounds for security
  const pepper = process.env.PEPPER;
  this.password = await bcrypt.hash(this.password + pepper, salt);
  next();
  }catch(err){
    next(err);
  }
});
userSchema.methods.comparePasswords = 
function(candidatePassword){
return bcrypt.compare(candidatePassword,this.password);
}
const User = mongoose.model('user',userSchema);
export default User