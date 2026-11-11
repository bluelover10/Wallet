import mongoose from 'mongoose';

const savingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null,
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: [1, 'Amount must be greater than 0']
  },
  date: {
    type: Date,
    required: [true, 'Please add a date'],
    default: Date.now,
    index: true
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Wallet', 'Other'],
    default: 'UPI'
  },
  referenceNumber: {
    type: String
  },
  notes: {
    type: String
  },
  type: {
    type: String,
    enum: ['Monthly', 'Extra'],
    default: 'Monthly'
  }
}, {
  timestamps: true
});

savingsSchema.index({ user: 1, date: -1 });
savingsSchema.index({ month: 1, year: 1 });

const Savings = mongoose.model('Savings', savingsSchema);
export default Savings;
