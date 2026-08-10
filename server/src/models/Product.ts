import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const isInteger = {
  validator: (v: number | null | undefined) => v == null || Number.isInteger(v),
  message: '{PATH} must be an integer number of paisa (see docs/ADR.md ADR-001)',
};

const variantSchema = new Schema(
  {
    size: { type: String, default: null },
    color: { type: String, default: null },
    sku: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    priceOverridePaisa: { type: Number, default: null, validate: isInteger },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },

    basePricePaisa: { type: Number, required: true, min: 0, validate: isInteger },
    salePricePaisa: { type: Number, default: null, min: 0, validate: isInteger },
    currency: { type: String, default: 'PKR', enum: ['PKR'] },

    images: { type: [String], default: [] },
    variants: { type: [variantSchema], default: [] },

    tags: { type: [String], default: [], index: true },
    rating: {
      avg: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },

    isActive: { type: Boolean, default: true, index: true },
    isNewIn: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

productSchema.index({ title: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ 'variants.sku': 1 });

export type ProductDoc = InferSchemaType<typeof productSchema> & { _id: Types.ObjectId };

export const Product = model('Product', productSchema);
