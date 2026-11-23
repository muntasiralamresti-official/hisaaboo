import mongoose, { Schema } from 'mongoose';

const PurchaseItemSchema = new Schema(
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
    customFields: {
      type: Map,
      of: String,
      default: {},
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
  },
  { _id: true }
);

const PurchaseSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business ID is required'],
      index: true,
    },
    billNo: {
      type: String,
      required: [true, 'Bill number is required'],
      trim: true,
    },
    partyId: {
      type: Schema.Types.ObjectId,
      ref: 'Party',
      required: [true, 'Supplier/Party is required'],
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    items: {
      type: [PurchaseItemSchema],
      validate: [
        (items) => items && items.length > 0,
        'Purchase must contain at least one item',
      ],
    },
    subTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bKash', 'Nagad', 'bank', 'none'],
      default: 'cash',
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

PurchaseSchema.index({ businessId: 1, isDeleted: 1, date: -1 });
PurchaseSchema.index({ businessId: 1, billNo: 1 });

export default mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);
