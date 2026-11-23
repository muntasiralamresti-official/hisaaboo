import mongoose, { Schema } from 'mongoose';

const QuotationItemSchema = new Schema(
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

const QuotationSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business ID is required'],
      index: true,
    },
    quotationNo: {
      type: String,
      required: [true, 'Quotation number is required'],
      trim: true,
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
    validUntil: {
      type: Date,
    },
    items: {
      type: [QuotationItemSchema],
      validate: [(items) => items && items.length > 0, 'Quotation must contain at least one item'],
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
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'converted', 'expired'],
      default: 'sent',
    },
    convertedSaleId: {
      type: Schema.Types.ObjectId,
      ref: 'Sale',
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

QuotationSchema.index({ businessId: 1, isDeleted: 1, date: -1 });

export default mongoose.models.Quotation || mongoose.model('Quotation', QuotationSchema);
