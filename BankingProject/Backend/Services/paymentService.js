
import mongoose from 'mongoose';
import Payment from '../Models/payment.js';

export const processPayment = async (paymentData, userId) => {
  try {
    // Validate required fields
    if (!paymentData.amount || !paymentData.currency || !paymentData.recipient) {
      throw new Error('Missing required payment fields');
    }

    // Validate amount is positive
    if (parseFloat(paymentData.amount) <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Database connection not available for payment processing');
      throw new Error('Payment service is temporarily unavailable. Please try again later.');
    }

    // Create new payment record
    const payment = new Payment({
      userId: userId,
      amount: parseFloat(paymentData.amount),
      currency: paymentData.currency,
      recipient: paymentData.recipient.trim(),
      description: paymentData.description?.trim() || '',
      status: 'pending'
    });

    // Save payment to database
    const savedPayment = await payment.save();

    // Simulate payment processing
    console.log(`Processing payment: ${paymentData.amount} ${paymentData.currency} to ${paymentData.recipient} by user ${userId}`);
    
    // Update payment status to completed
    savedPayment.status = 'completed';
    await savedPayment.save();

    console.log(`Payment completed successfully: Transaction ID ${savedPayment.transactionId}`);

    return {
      success: true,
      message: 'Payment processed successfully',
      payment: {
        transactionId: savedPayment.transactionId,
        amount: savedPayment.amount,
        currency: savedPayment.currency,
        recipient: savedPayment.recipient,
        status: savedPayment.status,
        createdAt: savedPayment.createdAt
      }
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerError') {
      throw new Error('Payment service is temporarily unavailable. Please try again later.');
    }
    
    throw new Error(error.message || 'Payment processing failed');
  }
};