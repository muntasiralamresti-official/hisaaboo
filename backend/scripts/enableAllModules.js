import mongoose from 'mongoose';
import { ALL_MODULES } from '../lib/templates.js';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/hisaaboo');
  const allIds = ALL_MODULES.map((m) => m.id);
  const result = await mongoose.connection.collection('businesses').updateMany(
    {},
    { $set: { enabledModules: allIds } }
  );
  console.log('Successfully updated businesses:', result.modifiedCount);
  await mongoose.disconnect();
}

run().catch(console.error);
