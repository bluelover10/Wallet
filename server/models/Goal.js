import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  name: {
    type: String,
    required: [true, 'Please add a goal name']
  },
  targetAmount: {
    type: Number,
    required: [true, 'Please add a target amount'],
    min: [1, 'Target amount must be greater than 0']
  },
  deadline: {
    type: Date,
    required: [true, 'Please add a deadline']
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['In Progress', 'Achieved', 'Cancelled'],
    default: 'In Progress',
    index: true
  },
  archived: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

const Goal = mongoose.model('Goal', goalSchema);
export default Goal;
