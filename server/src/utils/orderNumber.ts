import { Counter } from '../models/Counter.js';

/** Human-readable, unique, sequential per year: "ORD-2026-000481". */
export async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const key = `orderNumber:${year}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );

  return `ORD-${year}-${String(counter.seq).padStart(6, '0')}`;
}
