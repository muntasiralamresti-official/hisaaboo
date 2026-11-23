import mongoose, { Schema } from 'mongoose';

const PaymentSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business ID is required'],
      index: true,
    },
    partyId: {
      type: Schema.Types.ObjectId,
      ref: 'Party',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ['received', 'paid'],
      required: [true, 'Payment type (received/paid) is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    method: {
      type: String,
      enum: ['cash', 'bKash', 'Nagad', 'bank'],
      default: 'cash',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    saleId: {
      type: Schema.Types.ObjectId,
      ref: 'Sale',
      default: null,
    },
    purchaseId: {
      type: Schema.Types.ObjectId,
      ref: 'Purchase',
      default: null,
    },
    receiptNo: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
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

PaymentSchema.index({ businessId: 1, isDeleted: 1, date: -1 });
PaymentSchema.index({ businessId: 1, partyId: 1 });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
