import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
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
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/membership-plans', membershipPlanRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/gym-settings', gymSettingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorHandler);

export default app;
