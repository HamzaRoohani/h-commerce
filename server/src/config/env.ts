import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CLIENT_ORIGIN: z.string().min(1, 'CLIENT_ORIGIN is required'),
  COOKIE_DOMAIN: z.string().min(1, 'COOKIE_DOMAIN is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  EMAIL_FROM: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  PAYMENT_PROVIDER: z.enum(['cod', 'gateway', 'payfast', 'safepay', 'simpaisa']).default('cod'),

  // Phase 5 mock gateway (dev/test only — swapped for a real provider's
  // credentials once merchant sandbox access exists, see docs/ADR.md).
  MOCK_GATEWAY_SECRET: z.string().min(1).default('mock-gateway-dev-secret'),
  PENDING_ORDER_EXPIRY_MINUTES: z.coerce.number().positive().default(30),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Fix the environment variables above before starting the server.');
}

export const env = parsed.data;
