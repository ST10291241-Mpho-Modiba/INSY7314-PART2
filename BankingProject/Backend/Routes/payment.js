import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import auth from '../Middleware/auth.js'
import ProcessPayments, { getAccount, getTransactions } from '../Controller/paymentController.js'
import validatePayment from '../Middleware/validaters.js'


const paymentRouter = express.Router();

// Get user account data
paymentRouter.get('/account', auth, getAccount);

// Get user transactions
paymentRouter.get('/transactions', auth, getTransactions);

// Process Payment - Whitelisting inputs (amount, currency, etc.)
paymentRouter.post('/process', auth, validatePayment, ProcessPayments);

export default paymentRouter;