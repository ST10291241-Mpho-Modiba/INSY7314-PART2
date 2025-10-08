import express from 'express'
import dotenv from 'dotenv'
import fs from 'fs'
import https from 'https'
import { Console } from 'console';
import mongoose from 'mongoose';
import routes from './Routes/index.js'
import connectDB from './db/conn.js';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import xss from 'xss-clean';
import cors from 'cors';
import helmet from 'helmet';

// We are loading the enviroments variables from .env
dotenv.config({ path: './.env' });

//Initialise express app
const app = express();
const PORT = process.env.PORT || 5000;
const USE_HTTPS = process.env.USE_HTTPS ==='true';

app.use(helmet());
app.use(morgan('dev'));
// Adding middleware to parse JSON Bodies; Middleware using software that you did not create yourself
app.use(express.json())

const allowedOrigins = [
    'https://localhost:5173',
    'http://localhost:5173',
    'https://localhost:3000',
    'http://localhost:3000',
];
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}))

//routes 
app.use('/api',routes);

//Add basic route

//use MkCert generated certificates for HTTPS (only load if HTTPS is enabled)
let Options = {};
if (USE_HTTPS) {
  Options = {
    key: fs.readFileSync('./Certs/example.local-key.pem'),
    cert: fs.readFileSync('./Certs/example.local.pem')
  };
}

//Global rate limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
    windowMs: 15 *60*1000,
    max: 100,
    standardHeaders:true,
    legacyHeaders: false,
});

app.use(limiter);

const loginLimiter = rateLimit({
    windowMs: 15*60*1000,
    max: 100,
    message:"Too many login attempts. Please try again later",
    standardHeaders: true,
    legacyHeaders: false,

})



//Adding MongoDB Connection
connectDB();

// Start server based on environment
if (USE_HTTPS) {
  // starting HTTPS server
  https.createServer(Options, app).listen(PORT, () => {
    console.log(`HTTPS Server running on port ${PORT}`);
  });
} else {
  // starting HTTP server for development
  app.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
  });
}
