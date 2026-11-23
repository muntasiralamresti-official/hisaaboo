import dotenv from 'dotenv';
dotenv.config();

import connectDB from './lib/db.js';
import { Business, User, Party, Product } from './models/index.js';
import { hashPassword, comparePassword, signToken, verifyToken } from './lib/auth.js';
import { getTenantId, tenantFilter, withTenantData, tenantQueries } from './lib/tenant.js';

async function runStep2Tests() {
  console.log('=== STEP 2 VERIFICATION: AUTH & MULTI-TENANT ISOLATION ===\n');

  await connectDB();
  console.log('✓ Connected to MongoDB');

  // 1. Password Hashing & Verification
  console.log('\n[1] Testing Bcrypt Password Hashing:');
  const plainPass = 'secret123456';
  const hashed = await hashPassword(plainPass);
  const isValid = await comparePassword(plainPass, hashed);
  const isInvalid = await comparePassword('wrongpass', hashed);

  if (!isValid || isInvalid) {
    throw new Error('Password hashing or comparison failed');
  }
  console.log('✓ Bcrypt password hashing & validation passed');

  // 2. JWT Sign & Verify
  console.log('\n[2] Testing JWT Tokens:');
  const fakePayload = {
    userId: '60c72b2f9b1d8b0015f8a001',
    role: 'owner',
    businessId: '60c72b2f9b1d8b0015f8a002',
  };

  const token = signToken(fakePayload);
  const verified = verifyToken(token);

  if (!verified || verified.userId !== fakePayload.userId || verified.businessId !== fakePayload.businessId) {
    throw new Error('JWT signing or verification failed');
  }
  console.log('✓ JWT signed and verified successfully');

  // 3. Multi-Tenant Isolation Security Checks
  console.log('\n[3] Testing Multi-Tenant Isolation (lib/tenant.js):');

  // Mock Request from Tenant A
  const mockReqTenantA = {
    user: {
      id: 'user_a',
      role: 'owner',
      businessId: 'tenant_biz_A',
    },
    body: {
      businessId: 'HACKER_INJECTED_BIZ_ID', // Attacker trying to spoof businessId
      name: 'Test Customer',
      phone: '01700000001',
    },
  };

  // Check getTenantId
  const extractedTenant = getTenantId(mockReqTenantA);
  if (extractedTenant !== 'tenant_biz_A') {
    throw new Error('getTenantId failed to read businessId from user session');
  }
  console.log('✓ getTenantId strictly extracts from token, ignoring request body');

  // Check withTenantData removes injected businessId
  const securedData = withTenantData(mockReqTenantA, mockReqTenantA.body);
  if (securedData.businessId !== 'tenant_biz_A') {
    throw new Error('withTenantData failed to override and secure businessId');
  }
  console.log('✓ withTenantData stripped malicious businessId and enforced tenant ID:', securedData.businessId);

  // Check tenantFilter
  const filter = tenantFilter(mockReqTenantA, { type: 'customer' });
  if (filter.businessId !== 'tenant_biz_A' || filter.isDeleted !== false) {
    throw new Error('tenantFilter failed to attach businessId or isDeleted');
  }
  console.log('✓ tenantFilter automatically encloses query:', filter);

  // 4. Test Cross-Tenant Isolation in Database
  console.log('\n[4] Testing Database Query Multi-Tenant Boundary:');

  // Clean test artifacts if any
  await Party.deleteMany({ name: { $in: ['Tenant A Customer', 'Tenant B Customer'] } });

  const bizIdA = '60c72b2f9b1d8b0015f8a111';
  const bizIdB = '60c72b2f9b1d8b0015f8a222';

  // Create party under Tenant A
  const reqA = { user: { role: 'owner', businessId: bizIdA } };
  const partyA = await tenantQueries.create(Party, reqA, {
    name: 'Tenant A Customer',
    phone: '01711111111',
    type: 'customer',
    openingBalance: 5000,
  });

  // Create party under Tenant B
  const reqB = { user: { role: 'owner', businessId: bizIdB } };
  const partyB = await tenantQueries.create(Party, reqB, {
    name: 'Tenant B Customer',
    phone: '01722222222',
    type: 'customer',
    openingBalance: 10000,
  });

  // Tenant A queries parties
  const tenantAResults = await tenantQueries.find(Party, reqA, {});
  const tenantBResults = await tenantQueries.find(Party, reqB, {});

  const tenantACanSeeB = tenantAResults.some((p) => p.name === 'Tenant B Customer');
  const tenantBCanSeeA = tenantBResults.some((p) => p.name === 'Tenant A Customer');

  if (tenantACanSeeB || tenantBCanSeeA) {
    throw new Error('CRITICAL SECURITY LEAK: Tenant was able to query another business tenant data!');
  }

  console.log(`✓ Tenant A queries ${tenantAResults.length} records, CANNOT see Tenant B data`);
  console.log(`✓ Tenant B queries ${tenantBResults.length} records, CANNOT see Tenant A data`);
  console.log('✓ Cross-tenant data isolation 100% verified!');

  // Cleanup test documents
  await Party.deleteMany({ _id: { $in: [partyA._id, partyB._id] } });
  console.log('✓ Cleaned up temporary test data');

  console.log('\n=======================================');
  console.log('ALL STEP 2 BACKEND TESTS PASSED! ✓');
  console.log('=======================================');
  process.exit(0);
}

runStep2Tests().catch((err) => {
  console.error('STEP 2 TEST FAILED:', err);
  process.exit(1);
});
