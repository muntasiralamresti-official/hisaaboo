import dotenv from 'dotenv';
dotenv.config();

import connectDB from './lib/db.js';
import { Business, User } from './models/index.js';
import { signToken, comparePassword } from './lib/auth.js';

async function runStep3Tests() {
  console.log('=== STEP 3: SUPERADMIN BUSINESS MANAGEMENT VERIFICATION ===\n');

  await connectDB();
  console.log('✓ Connected to database');

  // Find Superadmin
  const superadmin = await User.findOne({ role: 'superadmin' });
  if (!superadmin) throw new Error('Superadmin account not found in DB');
  const superadminToken = signToken({
    userId: superadmin._id.toString(),
    role: 'superadmin',
    businessId: null,
  });

  // Find a normal user
  const normalOwner = await User.findOne({ role: 'owner' });
  const ownerToken = signToken({
    userId: normalOwner._id.toString(),
    role: 'owner',
    businessId: normalOwner.businessId.toString(),
  });

  console.log('✓ Test tokens generated for superadmin and owner');

  // Verify business count
  const allBiz = await Business.find();
  console.log(`✓ Current businesses count: ${allBiz.length}`);

  // Test Business Creation Simulation
  const testBizPhone = '01699999999';
  await Business.deleteOne({ phone: testBizPhone });
  await User.deleteOne({ phone: testBizPhone });

  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  const newBiz = await Business.create({
    name: 'মডার্ন ইয়ার্ন হাব',
    ownerName: 'তারেক মাহমুদ',
    phone: testBizPhone,
    address: 'মাইজদী, নোয়াখালী',
    businessType: 'yarn',
    yearlyFee: 15000,
    paidUntil: oneYearLater,
    paymentStatus: 'active',
    paymentHistory: [
      {
        amount: 15000,
        date: new Date(),
        method: 'bKash',
        notes: 'Initial fee 1 year',
        recordedBy: superadmin._id,
      },
    ],
  });

  const newOwner = await User.create({
    name: 'তারেক মাহমুদ',
    phone: testBizPhone,
    password: 'initialpassword123',
    role: 'owner',
    businessId: newBiz._id,
    isActive: true,
  });

  console.log('✓ New business created successfully:', newBiz.name, `(${newBiz.businessType})`);
  console.log('✓ Owner created and linked:', newOwner.name, newOwner.phone);

  // Test Payment Recording and Subscription Extension
  const originalPaidUntil = new Date(newBiz.paidUntil);
  const extendedDate = new Date(originalPaidUntil);
  extendedDate.setMonth(extendedDate.getMonth() + 12);

  newBiz.paidUntil = extendedDate;
  newBiz.paymentHistory.push({
    amount: 15000,
    date: new Date(),
    method: 'bank',
    notes: 'Renewed for year 2',
    recordedBy: superadmin._id,
  });
  await newBiz.save();
  console.log('✓ Subscription successfully extended to:', newBiz.paidUntil.toISOString());
  console.log('✓ Payment history entries:', newBiz.paymentHistory.length);

  // Test Owner Password Reset
  newOwner.password = 'newresetpassword456';
  await newOwner.save();
  const passMatch = await newOwner.comparePassword('newresetpassword456');
  if (!passMatch) throw new Error('Password reset failed');
  console.log('✓ Owner password reset verified');

  // Test Business Suspension Toggle
  newBiz.isSuspended = true;
  await newBiz.save();
  if (newBiz.isSubscriptionValid()) {
    throw new Error('Suspended business should not be valid');
  }
  console.log('✓ Business successfully suspended and locked');

  newBiz.isSuspended = false;
  await newBiz.save();
  if (!newBiz.isSubscriptionValid()) {
    throw new Error('Active business should be valid');
  }
  console.log('✓ Business successfully re-activated');

  // Clean test records
  await Business.deleteOne({ _id: newBiz._id });
  await User.deleteOne({ _id: newOwner._id });
  console.log('✓ Cleaned up test business and owner');

  console.log('\n=======================================');
  console.log('ALL STEP 3 BACKEND TESTS PASSED! ✓');
  console.log('=======================================');
  process.exit(0);
}

runStep3Tests().catch(err => {
  console.error('STEP 3 TEST FAILED:', err);
  process.exit(1);
});
