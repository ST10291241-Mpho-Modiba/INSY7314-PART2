import express from 'express'
import dotenv from 'dotenv'
import fs from 'fs'
import https from 'https'
import { Console } from 'console';
import mongoose from 'mongoose';
import routes from './Routes/index.js'
import app from './app.js'
import connectDB from './db/conn.js';
import morgan from 'morgan';
import xss from 'xss-clean';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import { globalLimiter } from './Middleware/rateLimiters.js';

// We are loading the enviroments variables from .env
dotenv.config({ path: './.env' });

//Initialise express app
const PORT = process.env.PORT || 5000;
const USE_HTTPS = process.env.USE_HTTPS ==='true';

// Configure helmet with HSTS (1 year = 31536000 seconds)
app.use(helmet({
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' }, // Prevent clickjacking
  xXssProtection: true,
}));
// Note: app middlewares are now in app.js; only server startup logic remains here.

//Add basic route

//use MkCert generated certificates for HTTPS (only load if HTTPS is enabled)
let Options = {};
if (USE_HTTPS) {
  Options = {
    key: fs.readFileSync('./Certs/example.local-key.pem'),
    cert: fs.readFileSync('./Certs/example.local.pem')
  };
}

//Global rate limiting is configured in app.js



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
