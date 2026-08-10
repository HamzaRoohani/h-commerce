import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { productRoutes } from './routes/productRoutes.js';
import { categoryRoutes } from './routes/categoryRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { cartRoutes } from './routes/cartRoutes.js';
import { orderRoutes } from './routes/orderRoutes.js';
import { webhookRoutes } from './routes/webhookRoutes.js';
import { devRoutes } from './routes/devRoutes.js';

export const app = express();

// Render/Railway sit behind a proxy — without this the rate limiter (added in
// Phase 3) sees one shared IP for every request and throttles everyone.
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN, // ADR-002: locked to the single frontend origin
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize());
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV });
});

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhooks', webhookRoutes);

// Simulates a gateway's server-to-server webhook call for local testing —
// never mounted in production, where a real gateway calls the route above.
if (env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRoutes);
}

app.use(notFoundHandler);
app.use(errorHandler);
