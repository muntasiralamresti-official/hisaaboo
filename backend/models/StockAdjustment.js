import mongoose, { Schema } from 'mongoose';

const StockAdjustmentSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business ID is required'],
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['increase', 'decrease'],
      required: [true, 'Adjustment type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.001, 'Quantity must be greater than zero'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

StockAdjustmentSchema.index({ businessId: 1, productId: 1, date: -1 });

export default mongoose.models.StockAdjustment || mongoose.model('StockAdjustment', StockAdjustmentSchema);
