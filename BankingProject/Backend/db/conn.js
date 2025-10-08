import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;
console.log(MONGODB_URI)

const connectDB = async()=>
{
    try{
        if (!MONGODB_URI) {
            console.warn('MongoDB URI not provided. Running without database connection.');
            return;
        }
        await mongoose.connect(MONGODB_URI);
        console.log(`MongoDB successfully connected`)
    }catch(err){
        console.error(`Failed to connect to MongoURI ${err.message}`)
        console.warn('Continuing without database connection for testing purposes.')
    }
}

export default connectDB;