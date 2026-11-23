import dotenv from 'dotenv';
dotenv.config();

import connectDB from './lib/db.js';
import { User, Business } from './models/index.js';
import { comparePassword, signToken, verifyToken } from './lib/auth.js';

async function testAuth() {
  console.log('Testing User Credentials from DB:');
  await connectDB();

  const superadmin = await User.findOne({ role: 'superadmin' });
  if (!superadmin) throw new Error('Superadmin not found');

  const match = await comparePassword('admin123', superadmin.password);
  console.log('✓ Superadmin password match:', match);

  const yarnOwner = await User.findOne({ phone: '01711111111' }).populate('businessId');
  if (!yarnOwner) throw new Error('Yarn owner not found');

  const yarnMatch = await comparePassword('owner123', yarnOwner.password);
  console.log('✓ Yarn owner password match:', yarnMatch);
  console.log('✓ Yarn owner business name:', yarnOwner.businessId.name);
  console.log('✓ Business type:', yarnOwner.businessId.businessType);

  const token = signToken({
    userId: yarnOwner._id.toString(),
    role: yarnOwner.role,
    businessId: yarnOwner.businessId._id.toString(),
  });
  const decoded = verifyToken(token);
  console.log('✓ Token decoded businessId:', decoded.businessId);

  console.log('\nAll auth credentials verified successfully!');
  process.exit(0);
}

testAuth().catch(err => {
  console.error(err);
  process.exit(1);
});
