import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'EUR', 'GBP', 'CAD'],
    default: 'USD'
  },
  recipient: {
    type: String,
    required: true,
    trim: true,
    minlength: [3, 'Recipient name must be at least 3 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

paymentSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = TXN__;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
