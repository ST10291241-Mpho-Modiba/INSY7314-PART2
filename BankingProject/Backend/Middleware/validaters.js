import {body, validationResult} from 'express-validator';

export const validatePayment = 
 [
  body('amount')
  .notEmpty()
  .matches(/^\d+(\.\d{2})?$/).withMessage('Invalid amount'),  // e.g., 100.00
  
  body('currency')
  .matches(/^(USD|EUR|GBP|CAD)$/i)
  .withMessage('Invalid currency'),  

  body('recipient')
  .matches(/^[a-zA-Z0-9\s]{1,50}$/)
  .withMessage('Invalid recipient'),
  (req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorMessages = errors.array().map(error => error.msg);
        return res.status(400).json({
            msg: errorMessages.join(', '),
            errors: errors.array()
        })
    }
    next();
}


];

// SWIFT/BIC code validation: 8 or 11 alphanumeric characters (uppercase)
export const validateSWIFTCode = [
  body('swiftCode')
    .notEmpty()
    .withMessage('SWIFT/BIC code is required')
    .matches(/^[A-Z0-9]{8}([A-Z0-9]{3})?$/)
    .withMessage('SWIFT/BIC code must be 8 or 11 alphanumeric characters (uppercase)'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return res.status(400).json({
        msg: errorMessages.join(', '),
        errors: errors.array()
      });
    }
    next();
  }
];

// Enhanced input validation to block SQL injection and script tags
export const sanitizeInput = (req, res, next) => {
  // Recursively sanitize request body
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Block SQL injection patterns and script tags
      if (/['";\\-]/.test(obj) || /<script|<\/script>/i.test(obj)) {
        throw new Error('Invalid input detected. SQL injection and script tags are not allowed.');
      }
      // Remove potentially dangerous characters
      return obj.replace(/['";\\-]/g, '').replace(/<script|<\/script>/gi, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  try {
    if (req.body) {
      req.body = sanitize(req.body);
    }
    next();
  } catch (error) {
    return res.status(400).json({
      msg: error.message || 'Invalid input detected'
    });
  }
};

export const validateSignUp = [
body('username')
.notEmpty()
.withMessage('Username is required')
.isLength({min:3})
.withMessage('Username must be at least three characters long'),

body('email')
.notEmpty()
.withMessage('Email is required'),

body('password')
.notEmpty()
.withMessage('Password is required')
.isLength({min:8})
.withMessage('Password must be at least 8 characters long')
.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
.withMessage('Password must contain at least 1 lowercase, 1 uppercase, 1 digit, and 1 special character'),

(req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorMessages = errors.array().map(error => error.msg);
        return res.status(400).json({
            msg: errorMessages.join(', '),
            errors: errors.array()
        })
    }
    next();
}
]

export const validateLogin = [
body('email')
.notEmpty().withMessage('Email is required')
.isEmail().withMessage('Enter a valid email'),

body('password')
.notEmpty()
.withMessage('Password is required')
.withMessage('Password must be at least 6 characters long'),

(req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorMessages = errors.array().map(error => error.msg);
        return res.status(400).json({
            msg: errorMessages.join(', '),
            errors: errors.array()
        })
    }
    next();
}
]


export const validateUserUpdate =[
    body('username').optional().isLength({min: 3}).withMessage('Username must be at least 3 characters'),
    body('email').optional().isEmail().withMessage('Invalid email address'),
    (req,res,next)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(400).json({
                msg: errorMessages.join(', '),
                errors: errors.array()
            })
        }
        next();
    }
];

export default validatePayment;



