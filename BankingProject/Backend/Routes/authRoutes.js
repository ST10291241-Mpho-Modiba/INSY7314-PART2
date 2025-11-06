import express from 'express';
import {signUp,Login, checkUsername, checkEmail} from '../Controller/authController.js';
import {validateSignUp,validateLogin} from '../Middleware/validaters.js'
import { loginLimiter } from '../Middleware/rateLimiters.js';

const router2 = express.Router();

router2.post('/signup',validateSignUp,signUp);
// Apply rate limiting to login route (10 attempts per 15 minutes)
router2.post('/login', loginLimiter, validateLogin, Login);
router2.post('/check-username', checkUsername);
router2.post('/check-email', checkEmail);

export default router2;