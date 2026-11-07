import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
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
import { persistentRateLimit } from './middlewares/persistentRateLimit.middleware.js';

const app = express();
const allowedOrigins = String(process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((value) => value.trim()).filter(Boolean);
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => { req.requestId = randomUUID(); res.setHeader('X-Request-Id', req.requestId); next(); });
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

const authLimiter = persistentRateLimit({ windowMs: 15 * 60 * 1000, limit: 60, message: 'Too many authentication requests. Try again later.' });
const loginLimiter = persistentRateLimit({ windowMs: 15 * 60 * 1000, limit: 10, message: 'Too many login attempts. Try again later.' });
const registrationLimiter = persistentRateLimit({ windowMs: 60 * 60 * 1000, limit: 8, message: 'Too many registration attempts. Try again later.' });
const verificationLimiter = persistentRateLimit({ windowMs: 60 * 60 * 1000, limit: 10, message: 'Too many verification requests. Try again later.' });
const passwordResetLimiter = persistentRateLimit({ windowMs: 60 * 60 * 1000, limit: 5, message: 'Too many password reset attempts. Try again later.' });
const paymentLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

// Razorpay signs the exact raw request body. This route must run before express.json().
app.post('/api/payments/razorpay/webhook', express.raw({ type: 'application/json', limit: '1mb' }), razorpayWebhook);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));
app.use(cookieParser());
app.use(originProtection);
morgan.token('request-id', (req) => req.requestId || '-');
app.use(morgan(':request-id :method :url :status :response-time ms'));

app.get('/api/health', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({ status: dbReady ? 'ok' : 'degraded', database: dbReady ? 'connected' : 'disconnected' });
});
app.get('/api/internal/cron/membership-expiry', cronProtection, async (req, res, next) => {
  try { res.json(await runMembershipExpiry()); } catch (err) { next(err); }
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registrationLimiter);
app.use('/api/auth/verify-email', verificationLimiter);
app.use('/api/auth/resend-verification-otp', verificationLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);
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
