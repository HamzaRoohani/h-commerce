import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const addressSchema = new Schema(
  {
    label: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true, default: 'Pakistan' },
    phone: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },

    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },

    addresses: { type: [addressSchema], default: [] },
    wishlist: { type: [Schema.Types.ObjectId], ref: 'Product', default: [] },

    // Rotated on every /auth/refresh call (§6.5) — a reused stale hash means
    // the refresh token was likely stolen.
    refreshTokenHash: { type: String, default: null, select: false },

    isVerified: { type: Boolean, default: false },
    verifyTokenHash: { type: String, default: null, select: false },
    verifyTokenExpires: { type: Date, default: null, select: false },

    resetTokenHash: { type: String, default: null, select: false },
    resetTokenExpires: { type: Date, default: null, select: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

export const User = model('User', userSchema);
