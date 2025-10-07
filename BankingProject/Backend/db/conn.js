import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;
console.log(MONGODB_URI)

const connectDB = async()=>
{
    try{
        await mongoose.connect(MONGODB_URI);
        console.log(`MongoDB successfully connected`)
    }catch(err){
        console.error(`Failed to connect to MongoURI ${err.message}`)
        process.exit(1)
    }
}

export default connectDB;