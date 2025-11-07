/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens for state-changing operations
 */

import crypto from 'crypto';

// Store CSRF tokens in memory (in production, use Redis or database)
const csrfTokens = new Map();

// Generate CSRF token
export const generateCSRFToken = (req, res, next) => {
  // Generate a random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Store token in session/memory
  if (!req.session) {
    req.session = {};
  }
  req.session.csrfToken = token;
  csrfTokens.set(token, {
    createdAt: Date.now(),
    expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
  });

  // Set token in response header
  res.setHeader('X-CSRF-Token', token);
  
  // Also set in response body for frontend
  res.locals.csrfToken = token;
  
  next();
};

// Validate CSRF token
export const validateCSRFToken = (req, res, next) => {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Ensure session exists
  if (!req.session) {
    return res.status(403).json({
      msg: 'Session not established. Please refresh the page and try again.'
    });
  }

  // Get token from header or body
  const token = req.headers['x-csrf-token'] || req.body.csrfToken || req.query.csrfToken;
  const sessionToken = req.session?.csrfToken;

  // Validate token exists
  if (!token) {
    return res.status(403).json({
      msg: 'CSRF token missing. Please refresh the page and try again.'
    });
  }

  // Check if token exists in store first (more reliable than session)
  const tokenData = csrfTokens.get(token);
  if (!tokenData) {
    return res.status(403).json({
      msg: 'CSRF token not found. Please refresh the page and try again.'
    });
  }

  // Check if token expired
  if (Date.now() > tokenData.expiresAt) {
    csrfTokens.delete(token);
    if (req.session.csrfToken === token) {
      delete req.session.csrfToken;
    }
    return res.status(403).json({
      msg: 'CSRF token expired. Please refresh the page and try again.'
    });
  }

  // Validate token matches session (if session token exists)
  // If session token doesn't exist, update it with the valid token
  if (!sessionToken) {
    req.session.csrfToken = token;
  } else if (token !== sessionToken) {
    return res.status(403).json({
      msg: 'Invalid CSRF token. Please refresh the page and try again.'
    });
  }

  // Token is valid
  next();
};

// Cleanup expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of csrfTokens.entries()) {
    if (now > data.expiresAt) {
      csrfTokens.delete(token);
    }
  }
}, 60 * 60 * 1000); // Cleanup every hour

