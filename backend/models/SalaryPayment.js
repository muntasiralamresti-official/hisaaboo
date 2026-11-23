import mongoose, { Schema } from 'mongoose';

const SalaryPaymentSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business ID is required'],
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true,
    },
    month: {
      type: String, // e.g. '2026-10'
      required: true,
    },
    type: {
      type: String,
      enum: ['salary', 'advance'],
      default: 'salary',
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than 0'],
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

SalaryPaymentSchema.index({ businessId: 1, isDeleted: 1, date: -1 });

export default mongoose.models.SalaryPayment || mongoose.model('SalaryPayment', SalaryPaymentSchema);
