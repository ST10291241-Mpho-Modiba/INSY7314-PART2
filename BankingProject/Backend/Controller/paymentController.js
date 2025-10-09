import { processPayment } from '../Services/paymentService.js';
import { validationResult } from 'express-validator';
import Payment from '../Models/payment.js';
import User from '../Models/user.js';

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

    console.log(`Processing payment request: ${amount} ${currency} to ${recipient} by user ${userId}`);

    const result = await processPayment(
      { amount, currency, recipient, description }, 
      userId
    );

    console.log(`Payment processed successfully: ${result.payment.transactionId}`);

    res.status(201).json({ 
      msg: result.message,
      payment: result.payment,
      success: true
    });
  } catch (err) {
    console.error('Payment controller error:', err);
    
    // Determine appropriate status code based on error message
    let statusCode = 400; // Default to bad request
    
    if (err.message.includes('temporarily unavailable') || 
        err.message.includes('service is temporarily unavailable')) {
      statusCode = 503; // Service unavailable
    } else if (err.message.includes('Validation failed')) {
      statusCode = 400; // Bad request for validation errors
    } else if (err.message.includes('unauthorized') || 
               err.message.includes('authentication')) {
      statusCode = 401; // Unauthorized
    } else if (err.message.includes('not found')) {
      statusCode = 404; // Not found
    } else if (err.message.includes('network') || 
               err.message.includes('connection')) {
      statusCode = 503; // Service unavailable for network issues
    }
    
    res.status(statusCode).json({ 
      msg: err.message || 'Payment processing failed',
      success: false,
      error: {
        type: statusCode === 503 ? 'service_unavailable' : 'payment_error',
        code: statusCode
      }
    });
  }
};

// Get user account data
export const getAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user information
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Calculate account data based on user's transactions
    const userPayments = await Payment.find({ userId });
    
    // Calculate balance (for demo purposes, starting with a base balance)
    const baseBalance = 5000; // Starting balance
    const totalSpent = userPayments
      .filter(payment => payment.status === 'completed')
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    const balance = baseBalance - totalSpent;
    
    // Calculate monthly spending (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlySpending = userPayments
      .filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear &&
               payment.status === 'completed';
      })
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate last month spending for comparison
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthSpending = userPayments
      .filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate.getMonth() === lastMonth && 
               paymentDate.getFullYear() === lastMonthYear &&
               payment.status === 'completed';
      })
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate percentage change
    let lastMonthChange = 0;
    let spendingChange = 0;
    
    if (lastMonthSpending > 0) {
      spendingChange = ((monthlySpending - lastMonthSpending) / lastMonthSpending) * 100;
    }
    
    // For balance change, we'll simulate a positive change
    lastMonthChange = 2.5; // 2.5% increase (demo value)

    const accountData = {
      balance: parseFloat(balance.toFixed(2)),
      availableCredit: parseFloat((balance * 0.8).toFixed(2)), // 80% of balance
      creditLimit: 10000, // Demo credit limit
      monthlySpending: parseFloat(monthlySpending.toFixed(2)),
      spendingChange: parseFloat(spendingChange.toFixed(2)),
      lastMonthChange: parseFloat(lastMonthChange.toFixed(2)),
      accountNumber: `****${user._id.toString().slice(-4)}`, // Masked account number
      accountType: 'Checking',
      username: user.username,
      email: user.email
    };

    res.status(200).json(accountData);
  } catch (err) {
    console.error('Get account error:', err);
    res.status(500).json({ 
      msg: err.message || 'Failed to fetch account data' 
    });
  }
};

// Get user transactions
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's payments/transactions
    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 }) // Most recent first
      .limit(50); // Limit to last 50 transactions

    // Transform payments to match frontend expectations
    const transactions = payments.map(payment => ({
      id: payment._id.toString(),
      type: 'debit', // All payments are debits from user's perspective
      description: payment.description || `Payment to ${payment.recipient}`,
      recipient: payment.recipient,
      amount: payment.amount,
      date: payment.createdAt,
      status: payment.status,
      category: 'Transfer', // Default category
      transactionId: payment.transactionId,
      currency: payment.currency
    }));

    // Add some demo credit transactions for a more realistic view
    if (transactions.length < 5) {
      const demoTransactions = [
        {
          id: 'demo_1',
          type: 'credit',
          description: 'Salary Deposit',
          recipient: 'Employer Inc.',
          amount: 3000,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          status: 'completed',
          category: 'Income',
          transactionId: 'TXN_SALARY_001',
          currency: 'USD'
        },
        {
          id: 'demo_2',
          type: 'credit',
          description: 'Refund',
          recipient: 'Online Store',
          amount: 150,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          status: 'completed',
          category: 'Refund',
          transactionId: 'TXN_REFUND_001',
          currency: 'USD'
        }
      ];
      
      transactions.push(...demoTransactions);
      
      // Sort by date again
      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    res.status(200).json(transactions);
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ 
      msg: err.message || 'Failed to fetch transactions' 
    });
  }
};

export default ProcessPayments;