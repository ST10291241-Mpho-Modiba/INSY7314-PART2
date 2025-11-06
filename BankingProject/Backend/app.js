import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import xss from 'xss-clean';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import routes from './Routes/index.js';
import { globalLimiter } from './Middleware/rateLimiters.js';

dotenv.config({ path: './.env' });

const app = express();
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// Helmet with HSTS
app.use(helmet({
  hsts: {
    maxAge: 31536000,
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
  xFrameOptions: { action: 'deny' },
  xXssProtection: true,
}));

app.use(morgan('dev'));

// Session for CSRF
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'default-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: USE_HTTPS,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(express.json());

const allowedOrigins = [
  'https://localhost:5173',
  'http://localhost:5173',
  'https://localhost:3000',
  'http://localhost:3000',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Global rate limiting
app.use(globalLimiter);

// Routes
app.use('/api', routes);

export default app;