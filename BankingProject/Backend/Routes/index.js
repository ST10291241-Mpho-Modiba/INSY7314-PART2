import express from 'express';
import router2 from './authRoutes.js'
//import router3 from './userRoutes.js'
import paymentRouter from './payment.js'
import { getAccount, getTransactions } from '../Controller/paymentController.js'
import auth from '../Middleware/auth.js'
import { generateCSRFToken } from '../Middleware/csrf.js'

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ 
    msg: 'Backend server is running successfully!', 
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// CSRF token endpoint for clients/tests to retrieve token without DB operations
router.get('/csrf-token', generateCSRFToken, (req, res) => {
  res.status(200).json({ csrfToken: res.locals.csrfToken });
});

// Account and transactions endpoints (directly under /api)
router.get('/account', auth, getAccount);
router.get('/transactions', auth, getTransactions);

router.use('/auth',router2);
router.use('/payments',paymentRouter);
//router.use('/user',router3);

export default router;