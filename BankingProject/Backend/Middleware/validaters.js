import {body, validationResult} from 'express-validator';

export const validatePayment = 
 [
  body('amount')
  .notEmpty()
  .matches(/^\d+(\.\d{2})?$/).withMessage('Invalid amount'),  // e.g., 100.00
  
  body('currency')
  .matches(/^(USD|EUR|GBP|ZAR)$/i)
  .withMessage('Invalid currency'),  

  body('recipient')
  .matches(/^[a-zA-Z0-9\s]{1,50}$/)
  .withMessage('Invalid recipient'),
  (req,res,next)=>{
    const error = validationResult(req);
    if(!error.isEmpty()){
        return res.status(400).json({errors: error.array})
    }
    next();
}


];

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
.isLength({min:6}).withMessage('Password must be at least 6 characters long'),

(req,res,next)=>{
    const error = validationResult(req);
    if(!error.isEmpty()){
        return res.status(400).json({errors: error.array})
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
    const error = validationResult(req);
    if(!error.isEmpty()){
        return res.status(400).json({errors: error.array})
    }
    next();
}
]


export const validateUserUpdate =[
    body('username').optional().isLength({min: 3}).withMessage('Username must be at least 3 characters'),
    body('email').optional().isEmail().withMessage('Invalid email address'),
    (req,res,next)=>{
        const error = validationResult(req);
        if(!error.isEmpty()){
            return res.status(400).json({errors:error.array()})
        }
        next();
    }
];

export default validatePayment;



