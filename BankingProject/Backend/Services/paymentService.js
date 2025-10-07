
export const processPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) 
    return res.status(400).json({ errors: errors.array() });

  try {
    console.log(`Payment: ${req.body.amount} ${req.body.currency} to ${req.body.recipient} by user ${req.user.id}`);
    res.json({ msg: 'Payment processed securely' });
  } catch (err) {
    res.status(500).json({ msg: 'Payment failed' });
  }
}