import mongoose, { Schema } from 'mongoose';

const EmployeeSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Employee phone is required'],
      trim: true,
    },
    designation: {
      type: String,
      default: 'স্টাফ',
      trim: true,
    },
    monthlySalary: {
      type: Number,
      required: [true, 'Monthly salary is required'],
      min: 0,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
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

EmployeeSchema.index({ businessId: 1, isDeleted: 1 });

export default mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
