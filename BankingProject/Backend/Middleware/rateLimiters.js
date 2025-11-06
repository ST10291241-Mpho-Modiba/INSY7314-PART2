import rateLimit from 'express-rate-limit';

// Login rate limiter: 10 attempts per 15 minutes (as per requirement)
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts (blocks on 11th try)
    message: "Too many login attempts. Please try again later",
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all attempts
});

// Global rate limiter: 100 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
