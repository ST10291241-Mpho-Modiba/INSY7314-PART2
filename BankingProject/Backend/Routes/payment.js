import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import auth from '../Middleware/auth.js'
import requireEmployee from '../Middleware/roleBaseAccessControl.js'
import { generateCSRFToken, validateCSRFToken } from '../Middleware/csrf.js'
import ProcessPayments, { getAccount, getTransactions, getAllTransactions, submitToSWIFT } from '../Controller/paymentController.js'
import validatePayment, { validateSWIFTCode, sanitizeInput } from '../Middleware/validaters.js'


const paymentRouter = express.Router();

// Get user account data
paymentRouter.get('/account', auth, generateCSRFToken, getAccount);

// Get user transactions
paymentRouter.get('/transactions', auth, generateCSRFToken, getTransactions);

// Process Payment - Whitelisting inputs (amount, currency, etc.) + CSRF protection
paymentRouter.post('/process', auth, validateCSRFToken, sanitizeInput, validatePayment, ProcessPayments);

// Employee-only endpoints (require employee role)
// Get all transactions for employee verification
paymentRouter.get('/all-transactions', auth, requireEmployee, generateCSRFToken, getAllTransactions);

// Submit transaction to SWIFT (requires employee role, JWT, CSRF, validation, audit trail)
paymentRouter.post('/submit-to-swift', auth, requireEmployee, validateCSRFToken, sanitizeInput, validateSWIFTCode, submitToSWIFT);

export default paymentRouter;