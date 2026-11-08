import User from '../models/user.model.js';
import GymAdmission from '../models/gymAdmission.model.js';
import Membership from '../models/membership.model.js';
import Payment from '../models/payment.model.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import BodyMeasurement from '../models/bodyMeasurement.model.js';
import OfflineSale from '../models/offlineSale.model.js';
import { getMembershipsByUserId } from './membership.service.js';

const TIMEZONE = process.env.GYM_TIMEZONE || 'Asia/Kolkata';
function zonedDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  return Object.fromEntries(parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
}
function startOfGymDay(date = new Date()) {
  const { year, month, day } = zonedDateParts(date);
  const offset = TIMEZONE === 'Asia/Kolkata' ? '+05:30' : 'Z';
  return new Date(`${year}-${month}-${day}T00:00:00${offset}`);
}
function startOfGymMonth(date = new Date()) {
  const { year, month } = zonedDateParts(date);
  const offset = TIMEZONE === 'Asia/Kolkata' ? '+05:30' : 'Z';
  return new Date(`${year}-${month}-01T00:00:00${offset}`);
}

export async function getAdminStats() {
  const now = new Date();
  const todayStart = startOfGymDay(now);
  const monthStart = startOfGymMonth(now);
  const twoDaysFromNow = new Date(now); twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  const [totalUsers, admittedUsersAgg, activeMemberships, expiredMemberships, totalOrders, pendingOrders, totalProducts, gymRevenueAgg, storeRevenueAgg, offlineStoreRevenueAgg, todayRevenueAgg, todayOfflineRevenueAgg, monthRevenueAgg, monthOfflineRevenueAgg, expiringMemberships, lowStockProducts, recentOrders, recentPayments] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    GymAdmission.aggregate([
      { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $match: { 'user.role': 'user' } },
      { $count: 'total' },
    ]),
    Membership.countDocuments({ status: 'active' }),
    Membership.countDocuments({ status: 'expired' }),
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending', payment_status: 'pending' }),
    Product.countDocuments({ is_active: true }),
    Payment.aggregate([{ $match: { status: 'success', payment_type: { $in: ['membership_full', 'membership_advance', 'membership_installment'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payment.aggregate([{ $match: { status: 'success', payment_type: 'order' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    OfflineSale.aggregate([{ $group: { _id: null, total: { $sum: '$total_amount' } } }]),
    Payment.aggregate([{ $match: { status: 'success', payment_date: { $gte: todayStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    OfflineSale.aggregate([{ $match: { createdAt: { $gte: todayStart } } }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
    Payment.aggregate([{ $match: { status: 'success', payment_date: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    OfflineSale.aggregate([{ $match: { createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
    Membership.find({ status: 'active', end_date: { $gte: now, $lte: twoDaysFromNow } }).populate({ path: 'user_id', select: 'full_name email' }).sort({ end_date: 1 }).limit(5).lean(),
    Product.find({ is_active: true, stock_quantity: { $lte: 10 } }).select('name stock_quantity').sort({ stock_quantity: 1 }).limit(5).lean(),
    Order.find().populate({ path: 'user_id', select: 'full_name email' }).sort({ createdAt: -1 }).limit(5).lean(),
    Payment.find().populate({ path: 'user_id', select: 'full_name email' }).sort({ createdAt: -1 }).limit(8).lean(),
  ]);
  const totalAdmitted = admittedUsersAgg[0]?.total || 0;
  const gymRevenue = gymRevenueAgg[0]?.total || 0;
  const storeRevenue = (storeRevenueAgg[0]?.total || 0) + (offlineStoreRevenueAgg[0]?.total || 0);
  const todayRevenue = (todayRevenueAgg[0]?.total || 0) + (todayOfflineRevenueAgg[0]?.total || 0);
  const monthRevenue = (monthRevenueAgg[0]?.total || 0) + (monthOfflineRevenueAgg[0]?.total || 0);
  return {
    stats: { totalUsers, totalAdmitted, notAdmitted: Math.max(0, totalUsers - totalAdmitted), activeMemberships, expiredMemberships, totalOrders, pendingOrders, totalProducts, gymRevenue, storeRevenue, totalRevenue: gymRevenue + storeRevenue, todayRevenue, monthRevenue },
    expiringMemberships, lowStockProducts, recentOrders, recentPayments,
  };
}

export async function getRevenueAnalytics(period) {
  const now = new Date();
  const { year, month, day } = zonedDateParts(now);
  const start = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  let groupFormat = '%Y-%m-%d';

  switch (period) {
    case '7d':
      start.setUTCDate(start.getUTCDate() - 6);
      break;
    case '30d':
      start.setUTCDate(start.getUTCDate() - 29);
      break;
    case '3m':
      start.setUTCDate(1);
      start.setUTCMonth(start.getUTCMonth() - 2);
      groupFormat = '%Y-%m';
      break;
    case '6m':
      start.setUTCDate(1);
      start.setUTCMonth(start.getUTCMonth() - 5);
      groupFormat = '%Y-%m';
      break;
    case '1y':
      start.setUTCDate(1);
      start.setUTCMonth(start.getUTCMonth() - 11);
      groupFormat = '%Y-%m';
      break;
    default:
      start.setUTCDate(start.getUTCDate() - 29);
  }

  const dateKey = start.toISOString().slice(0, 10);
  const offset = TIMEZONE === 'Asia/Kolkata' ? '+05:30' : 'Z';
  const startDate = new Date(`${dateKey}T00:00:00${offset}`);
  const groupStage = { $dateToString: { format: groupFormat, date: '$payment_date', timezone: TIMEZONE } };
  const [gymData, storeData, offlineStoreData] = await Promise.all([
    Payment.aggregate([{ $match: { status: 'success', payment_type: { $in: ['membership_full', 'membership_advance', 'membership_installment'] }, payment_date: { $gte: startDate } } }, { $group: { _id: groupStage, total: { $sum: '$amount' } } }, { $sort: { _id: 1 } }]),
    Payment.aggregate([{ $match: { status: 'success', payment_type: 'order', payment_date: { $gte: startDate } } }, { $group: { _id: groupStage, total: { $sum: '$amount' } } }, { $sort: { _id: 1 } }]),
    OfflineSale.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: groupFormat, date: '$createdAt', timezone: TIMEZONE } }, total: { $sum: '$total_amount' } } }, { $sort: { _id: 1 } }]),
  ]);
  const storeTotalsByDate = new Map();
  for (const entry of [...storeData, ...offlineStoreData]) {
    storeTotalsByDate.set(entry._id, (storeTotalsByDate.get(entry._id) || 0) + entry.total);
  }
  return {
    gymRevenue: gymData.map((d) => ({ date: d._id, amount: d.total })),
    storeRevenue: [...storeTotalsByDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date, amount })),
  };
}

export async function getUserDashboard(userId) {
  const [admission, payments, orders, memberships, measurements] = await Promise.all([
    GymAdmission.findOne({ user_id: userId }).lean(),
    Payment.find({ user_id: userId }).select('-razorpay_signature').sort({ createdAt: -1 }).lean(),
    Order.find({ user_id: userId }).sort({ createdAt: -1 }).lean(),
    getMembershipsByUserId(userId),
    BodyMeasurement.find({ user_id: userId }).sort({ measurement_date: -1 }).lean(),
  ]);

  const isAdmitted = admission?.status === 'active';

  const activeMembership = memberships.find((membership) => (
    ['active', 'scheduled'].includes(membership.status) && membership.payment_status === 'paid'
  )) || null;
  const pendingMembership = memberships.find((membership) => (
    membership.payment_status === 'pending' && Number(membership.amount_due) > 0
  )) || null;

  return {
    memberships,
    payments,
    orders,
    measurements,
    admission,
    gym_access: {
      is_admitted: isAdmitted,
      admission_status: admission?.status || 'not_admitted',
      has_membership: Boolean(activeMembership),
      membership_status: pendingMembership ? 'payment_pending' : activeMembership?.status || 'not_purchased',
      message: pendingMembership
        ? 'Your membership payment is pending. Complete the payment to activate your gym access.'
        : !isAdmitted
          ? 'Your gym admission is pending. Contact the gym admin to complete admission.'
          : !activeMembership
            ? 'Your gym admission is complete. Choose a membership plan to activate your gym membership.'
            : '',
    },
  };
}
