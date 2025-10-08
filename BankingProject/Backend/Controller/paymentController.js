import { processPayment } from '../Services/paymentService.js';
import { validationResult } from 'express-validator';

export const ProcessPayments = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        msg: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { amount, currency, recipient, description } = req.body;
    const userId = req.user.id;

    const result = await processPayment(
      { amount, currency, recipient, description }, 
      userId
    );

    res.status(201).json({ 
      msg: result.message,
      payment: result.payment 
    });
  } catch (err) {
    console.error('Payment controller error:', err);
    res.status(400).json({ 
      msg: err.message || 'Payment processing failed' 
    });
  }
};

export default ProcessPayments;