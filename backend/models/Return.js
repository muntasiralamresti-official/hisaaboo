import mongoose, { Schema } from 'mongoose';

const ReturnItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.001, 'Quantity must be greater than 0'],
    },
    rate: {
      type: Number,
      required: true,
      min: [0, 'Rate cannot be negative'],
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative'],
    },
    customFields: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { _id: true }
);

const ReturnSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business ID is required'],
      index: true,
    },
    returnNo: {
      type: String,
      required: [true, 'Return number is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['sale_return', 'purchase_return'],
      required: [true, 'Return type is required'],
      index: true,
    },
    partyId: {
      type: Schema.Types.ObjectId,
      ref: 'Party',
      required: [true, 'Party is required'],
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    items: {
      type: [ReturnItemSchema],
      validate: [(items) => items && items.length > 0, 'Return must contain at least one item'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      enum: ['damage', 'defect', 'count_mismatch', 'excess', 'other'],
      default: 'damage',
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

ReturnSchema.index({ businessId: 1, isDeleted: 1, date: -1 });

export default mongoose.models.Return || mongoose.model('Return', ReturnSchema);
