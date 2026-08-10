/**
 * Promotes an existing user to role='admin' by email. Admin accounts are
 * never created via public registration, so this is the provisioning path.
 *
 * Usage: npm run promote-admin -- someone@example.com
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

async function promoteAdmin() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npm run promote-admin -- <email>');
    process.exit(1);
  }

  await mongoose.connect(env.MONGODB_URI);

  const result = await User.updateOne({ email: email.toLowerCase() }, { $set: { role: 'admin' } });
  if (result.matchedCount === 0) {
    console.error(`[promote-admin] no user found with email ${email}`);
  } else {
    console.log(`[promote-admin] ${email} is now an admin`);
  }

  await mongoose.disconnect();
}

promoteAdmin().catch((err) => {
  console.error('[promote-admin] failed:', err);
  process.exit(1);
});
