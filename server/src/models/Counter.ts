import { Schema, model } from 'mongoose';

// Backs atomic sequence generation (e.g. per-year order numbers).
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export const Counter = model('Counter', counterSchema);
