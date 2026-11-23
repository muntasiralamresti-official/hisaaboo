import mongoose, { Schema } from 'mongoose';

const PartySchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Party name is required'],
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: ['customer', 'supplier', 'both'],
      default: 'customer',
      required: true,
    },
    openingBalance: {
      type: Number,
      default: 0,
      // Positive: Party owes business (Receivable / দেনাদার / বাকি)
      // Negative: Business owes party (Payable / পাওনাদার)
    },
    notes: {
      type: String,
      default: '',
      trim: true,
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

// Compound index for querying active parties within a business
PartySchema.index({ businessId: 1, isDeleted: 1, name: 1 });
PartySchema.index({ businessId: 1, type: 1 });

export default mongoose.models.Party || mongoose.model('Party', PartySchema);
