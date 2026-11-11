import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add a withdrawal amount'],
    min: [1, 'Amount must be greater than 0']
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason for withdrawal']
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

withdrawalSchema.index({ user: 1, date: -1 });

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
export default Withdrawal;
