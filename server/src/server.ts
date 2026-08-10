import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { app } from './app.js';
import { expireStalePendingOrders } from './services/pendingOrderExpiry.js';

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

async function main() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`[server] H. API listening on http://localhost:${env.PORT}`);
  });

  await runExpirySweep();
  setInterval(runExpirySweep, SWEEP_INTERVAL_MS);
}

async function runExpirySweep() {
  const count = await expireStalePendingOrders();
  if (count > 0) console.log(`[pending-order-expiry] cancelled ${count} stale order(s)`);
}

main().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
