import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import admissionRoutes from './routes/admission.route.js';
import membershipPlanRoutes from './routes/membershipPlan.route.js';
import membershipRoutes from './routes/membership.route.js';
import paymentRoutes from './routes/payment.route.js';
import measurementRoutes from './routes/measurement.route.js';
import productRoutes from './routes/products.route.js';
import orderRoutes from './routes/order.route.js';
import notificationRoutes from './routes/notification.route.js';
import settingsRoutes from './routes/setting.route.js';
import gymSettingsRoutes from './routes/gymsetting.route.js';
import dashboardRoutes from './routes/dashboard.route.js';
import { razorpayWebhook } from './controllers/payment.controller.js';
import { runMembershipExpiry } from './jobs/membershipExpiry.job.js';
import { originProtection, cronProtection } from './middlewares/security.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();
const allowedOrigins = String(process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map((value) => value.trim()).filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false });
const paymentLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

// Razorpay signs the exact raw request body. This route must run before express.json().
app.post('/api/payments/razorpay/webhook', express.raw({ type: 'application/json', limit: '1mb' }), razorpayWebhook);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));
app.use(cookieParser());
app.use(originProtection);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({ status: dbReady ? 'ok' : 'degraded', database: dbReady ? 'connected' : 'disconnected' });
});

app.get('/api/internal/cron/membership-expiry', cronProtection, async (req, res, next) => {
  try { res.json(await runMembershipExpiry()); } catch (err) { next(err); }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/membership-plans', membershipPlanRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/gym-settings', gymSettingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

export default app;
