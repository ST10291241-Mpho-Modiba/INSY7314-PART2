import React, { useState } from 'react';
import api from '../api/axiosConfig';

const Payments = () => {
  const [formData, setFormData] = useState({ amount: '', currency: 'USD', recipient: '' });
  const [msg, setMsg] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validateInputs = () => {
    const amountRegex = /^\d+(\.\d{2})?$/;
    const currencyRegex = /^(USD|EUR|GBP)$/i;
    const recipientRegex = /^[a-zA-Z0-9\s]{1,100}$/;
    if (!amountRegex.test(formData.amount) || parseFloat(formData.amount) <= 0) return 'Amount: Positive decimal e.g., 100.00';
    if (!currencyRegex.test(formData.currency)) return 'Currency: USD, EUR, or GBP';
    if (!recipientRegex.test(formData.recipient)) return 'Recipient: Alphanumeric + spaces, max 100 chars';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateInputs();
    if (validationError) {
      setMsg(validationError);
      return;
    }

    try {
      const res = await api.post('/api/payments/process', formData);
      setMsg(res.data.msg);
    } catch (err) {
      setMsg(err.response?.data?.msg || 'Payment failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Process International Payment</h2>
      <input
        type="text"
        name="amount"
        value={formData.amount}
        onChange={handleChange}
        placeholder="Amount (e.g., 100.00)"
        required
        pattern="\d+(\.\d{2})?"
        title="Positive decimal amount"
      />
      <select name="currency" value={formData.currency} onChange={handleChange} required>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
      </select>
      <input
        type="text"
        name="recipient"
        value={formData.recipient}
        onChange={handleChange}
        placeholder="Recipient Name"
        required
        pattern="[a-zA-Z0-9\s]{1,100}"
        title="Alphanumeric + spaces"
      />
      <button type="submit">Process Secure Payment</button>
      {msg && <p className={msg.includes('error') || msg.includes('failed') ? 'error' : 'msg'}>{msg}</p>}
    </form>
  );
};

export default Payments;