import express from 'express';
import {signUp,Login, checkUsername, checkEmail} from '../Controller/authController.js';
import {validateSignUp,validateLogin} from '../Middleware/validaters.js'

const router2 = express.Router();

router2.post('/signup',validateSignUp,signUp);
router2.post('/login',validateLogin,Login);
router2.post('/check-username', checkUsername);
router2.post('/check-email', checkEmail);

export default router2;