import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { isInteger } from '../utils/paisaValidator.js';

const cartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantSku: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    // Display-only (§7) — checkout always recomputes from live Product prices.
    priceAtAddPaisa: { type: Number, required: true, validate: isInteger },
  },
  { _id: false },
);

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export type CartDoc = InferSchemaType<typeof cartSchema> & { _id: Types.ObjectId };

export const Cart = model('Cart', cartSchema);
