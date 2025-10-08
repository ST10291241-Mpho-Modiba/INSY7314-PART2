
import Payment from '../Models/payment.js';

export const processPayment = async (paymentData, userId) => {
  try {
    // Validate required fields
    if (!paymentData.amount || !paymentData.currency || !paymentData.recipient) {
      throw new Error('Missing required payment fields');
    }

    // Create new payment record
    const payment = new Payment({
      userId: userId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      recipient: paymentData.recipient,
      description: paymentData.description || '',
      status: 'pending'
    });

    // Save payment to database
    const savedPayment = await payment.save();

    // Simulate payment processing
    console.log(`Processing payment: ${paymentData.amount} ${paymentData.currency} to ${paymentData.recipient} by user ${userId}`);
    
    // Update payment status to completed
    savedPayment.status = 'completed';
    await savedPayment.save();

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
    throw new Error(error.message || 'Payment processing failed');
  }
};