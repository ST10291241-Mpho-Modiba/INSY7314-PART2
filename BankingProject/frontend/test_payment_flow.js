const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

async function testPaymentFlow() {
  console.log('=== Testing Payment Flow ===\n');
  
  try {
    // Step 1: Test signup to get a valid token (since MongoDB is not connected, this should use fallback mode)
    console.log('1. Testing signup to get valid token...');
    const signupResponse = await api.post('/api/auth/signup', {
      username: 'testuser_' + Date.now(),
      email: 'test_' + Date.now() + '@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    });
    
    console.log('Signup response:', {
      status: signupResponse.status,
      hasToken: !!signupResponse.data.token,
      hasUser: !!signupResponse.data.user
    });
    
    const token = signupResponse.data.token;
    
    // Step 2: Test payment with valid token but no MongoDB
    console.log('\n2. Testing payment with valid token (MongoDB not connected)...');
    api.defaults.headers.Authorization = `Bearer ${token}`;
    
    try {
      const paymentResponse = await api.post('/api/payments/process', {
        amount: 100,
        currency: 'USD',
        recipient: 'Test Recipient',
        description: 'Test payment'
      });
      
      console.log('Unexpected payment success:', paymentResponse.data);
    } catch (paymentError) {
      console.log('Payment error (expected):', {
        status: paymentError.response?.status,
        message: paymentError.response?.data?.msg,
        success: paymentError.response?.data?.success,
        errorType: paymentError.response?.data?.error?.type,
        errorCode: paymentError.response?.data?.error?.code
      });
    }
    
    // Step 3: Test payment with invalid data
    console.log('\n3. Testing payment with invalid data...');
    try {
      const invalidPaymentResponse = await api.post('/api/payments/process', {
        amount: -50, // Invalid negative amount
        currency: 'USD',
        recipient: '',
        description: 'Invalid payment'
      });
      
      console.log('Unexpected success with invalid data:', invalidPaymentResponse.data);
    } catch (invalidError) {
      console.log('Invalid payment error (expected):', {
        status: invalidError.response?.status,
        message: invalidError.response?.data?.msg,
        success: invalidError.response?.data?.success,
        errorType: invalidError.response?.data?.error?.type
      });
    }
    
  } catch (error) {
    console.error('Test failed:', {
      status: error.response?.status,
      message: error.response?.data?.msg || error.message,
      data: error.response?.data
    });
  }
}

testPaymentFlow();