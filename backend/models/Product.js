import mongoose, { Schema } from 'mongoose';

const ProductSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
    },
    purchasePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    salePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
    lowStockLevel: {
      type: Number,
      default: 5,
    },
    // Driven purely by the business template (e.g. count, color, lot for yarn)
    // Never hardcode yarn-specific fields here!
    customFields: {
      type: Map,
      of: String,
      default: {},
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

ProductSchema.index({ businessId: 1, isDeleted: 1, name: 1 });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
