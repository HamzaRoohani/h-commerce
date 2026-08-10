import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

// Idempotency ledger (§5): a duplicate eventId on insert means the gateway
// retried a webhook we already processed — the unique index turns that
// into a harmless no-op instead of double-crediting the order.
const webhookEventSchema = new Schema({
  provider: { type: String, required: true },
  eventId: { type: String, required: true, unique: true, index: true },
  payload: { type: Schema.Types.Mixed, required: true },
  processedAt: { type: Date, default: () => new Date() },
});

export type WebhookEventDoc = InferSchemaType<typeof webhookEventSchema> & { _id: Types.ObjectId };

export const WebhookEvent = model('WebhookEvent', webhookEventSchema);
