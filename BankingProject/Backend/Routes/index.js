import express from 'express';
import router2 from './authRoutes.js'
//import router3 from './userRoutes.js'
import paymentRouter from './payment.js'
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ 
    msg: 'Backend server is running successfully!', 
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

router.use('/auth',router2);
router.use('/payments',paymentRouter);
//router.use('/user',router3);

export default router;