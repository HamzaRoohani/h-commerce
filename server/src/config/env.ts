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

  // Phase 7: shared with the client's app/api/revalidate route so admin
  // product mutations can trigger on-demand ISR (§11 of the build plan).
  REVALIDATE_SECRET: z.string().min(1).default('revalidate-dev-secret'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Fix the environment variables above before starting the server.');
}

export const env = parsed.data;

// Dev-only defaults/placeholders that must never reach production — each one
// leaking would let an outsider forge webhook events, trigger revalidation,
// or mint valid JWTs.
if (env.NODE_ENV === 'production') {
  const insecureDefaults: Record<string, string> = {
    MOCK_GATEWAY_SECRET: 'mock-gateway-dev-secret',
    REVALIDATE_SECRET: 'revalidate-dev-secret',
    JWT_ACCESS_SECRET: 'replace_me_dev_only',
    JWT_REFRESH_SECRET: 'replace_me_dev_only_too',
  };
  const offenders = Object.entries(insecureDefaults)
    .filter(([key, devValue]) => env[key as keyof typeof env] === devValue)
    .map(([key]) => key);

  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    offenders.push('JWT_ACCESS_SECRET/JWT_REFRESH_SECRET (must differ)');
  }
  if (env.JWT_ACCESS_SECRET.length < 32 || env.JWT_REFRESH_SECRET.length < 32) {
    offenders.push('JWT_ACCESS_SECRET/JWT_REFRESH_SECRET (must be at least 32 characters)');
  }
  if (env.COOKIE_DOMAIN === 'localhost') {
    offenders.push('COOKIE_DOMAIN');
  }

  if (offenders.length > 0) {
    throw new Error(
      `Refusing to start in production with insecure/default environment values: ${offenders.join(', ')}`,
    );
  }
}
