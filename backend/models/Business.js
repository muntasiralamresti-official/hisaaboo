import mongoose, { Schema } from 'mongoose';

const PaymentHistorySchema = new Schema(
  {
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: {
      type: String,
      enum: ['cash', 'bKash', 'Nagad', 'bank'],
      default: 'cash',
    },
    notes: { type: String, default: '' },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true }
);

const BusinessSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    invoiceFooterNote: {
      type: String,
      default: 'ধন্যবাদ, আবার আসবেন।',
      trim: true,
    },
    businessType: {
      type: String,
      enum: ['yarn', 'general', 'grocery', 'electronics', 'pharmacy', 'clothing', 'hardware'],
      default: 'general',
      required: true,
    },
    enabledModules: {
      type: [String],
      default: [
        'dashboard',
        'parties',
        'products',
        'sales',
        'purchases',
        'payments',
        'expenses',
        'cashbook',
        'reports',
        'settings',
      ],
    },
    yearlyFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidUntil: {
      type: Date,
      required: [true, 'Paid-until date is required'],
    },
    paymentStatus: {
      type: String,
      enum: ['active', 'expired', 'trial', 'suspended'],
      default: 'active',
    },
    paymentHistory: [PaymentHistorySchema],
    language: {
      type: String,
      enum: ['bn', 'en'],
      default: 'bn',
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to check if subscription is valid
BusinessSchema.methods.isSubscriptionValid = function () {
  if (this.isSuspended) return false;
  if (!this.paidUntil) return false;
  return new Date(this.paidUntil).getTime() >= Date.now();
};

export default mongoose.models.Business || mongoose.model('Business', BusinessSchema);
