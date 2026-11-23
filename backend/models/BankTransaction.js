import mongoose, { Schema } from 'mongoose';

const BankTransactionSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business ID is required'],
      index: true,
    },
    bankAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'BankAccount',
      required: [true, 'Bank Account is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdraw', 'transfer'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than 0'],
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    chequeNo: {
      type: String,
      default: '',
      trim: true,
    },
    reference: {
      type: String,
      default: '',
      trim: true,
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

BankTransactionSchema.index({ businessId: 1, isDeleted: 1, date: -1 });

export default mongoose.models.BankTransaction || mongoose.model('BankTransaction', BankTransactionSchema);
