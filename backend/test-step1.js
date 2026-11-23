import dotenv from 'dotenv';
dotenv.config();

import connectDB from './lib/db.js';
import {
  Business,
  User,
  Party,
  Product,
  Sale,
  Purchase,
  Payment,
  Expense,
  StockAdjustment,
  AuditLog,
} from './models/index.js';
import {
  getTemplate,
  getAllTemplates,
  getTemplateCustomFields,
  getTemplateUnits,
  getTemplateExpenseCategories,
  getTemplateLabel,
} from './lib/templates.js';

async function verifyBackend() {
  console.log('=== VERIFYING BACKEND ARCHITECTURE ===');
  console.log('Testing Templates:');
  const yarn = getTemplate('yarn');
  console.log('✓ Yarn Template:', yarn.name.bn);
  console.log('✓ Yarn units:', getTemplateUnits('yarn').map(u => u.key).join(', '));
  console.log('✓ Yarn fields:', getTemplateCustomFields('yarn').map(f => f.key).join(', '));
  console.log('✓ Yarn expenses:', getTemplateExpenseCategories('yarn').map(e => e.key).join(', '));

  const general = getTemplate('general');
  console.log('✓ General Template:', general.name.bn);
  console.log('✓ General units:', getTemplateUnits('general').map(u => u.key).join(', '));

  console.log('\nConnecting to MongoDB:');
  const conn = await connectDB();
  console.log('✓ Connected to MongoDB:', conn.connection.name);

  console.log('\nValidating Models:');
  const models = [Business, User, Party, Product, Sale, Purchase, Payment, Expense, StockAdjustment, AuditLog];
  models.forEach(m => console.log(`✓ Model registered: ${m.modelName}`));

  console.log('\nBackend verification successful!');
  process.exit(0);
}

verifyBackend().catch(err => {
  console.error('Backend verification failed:', err);
  process.exit(1);
});
