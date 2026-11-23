import mongoose, { Schema } from 'mongoose';

const ExpenseSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business ID is required'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bKash', 'Nagad', 'bank'],
      default: 'cash',
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ExpenseSchema.index({ businessId: 1, isDeleted: 1, date: -1 });
ExpenseSchema.index({ businessId: 1, category: 1 });

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
