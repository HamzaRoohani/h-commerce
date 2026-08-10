import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { isInteger } from '../utils/paisaValidator.js';

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    variantSku: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    unitPricePaisa: { type: Number, required: true, validate: isInteger },
  },
  { _id: false },
);

const shippingAddressSchema = new Schema(
  {
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true, default: 'Pakistan' },
    phone: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },

    subtotalPaisa: { type: Number, required: true, validate: isInteger },
    shippingPaisa: { type: Number, required: true, validate: isInteger },
    totalPaisa: { type: Number, required: true, validate: isInteger },

    paymentMethod: { type: String, enum: ['cod', 'gateway'], required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentRef: { type: String, default: null },
    paymentProvider: { type: String, default: null },

    // Independent from paymentStatus: a COD order ships while payment is
    // still 'pending' and only flips to 'paid' on delivery (§4).
    orderStatus: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled'],
      default: 'processing',
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export type OrderDoc = InferSchemaType<typeof orderSchema> & { _id: Types.ObjectId };

export const Order = model('Order', orderSchema);
