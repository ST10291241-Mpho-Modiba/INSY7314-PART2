import express from 'express';
import {signUp,Login} from '../Controller/authController.js';
import {validateSignUp,validateLogin} from '../Middleware/validaters.js'

const router2 = express.Router();

router2.post('/signup',validateSignUp,signUp);
router2.post('/login',validateLogin,Login);

export default router2;