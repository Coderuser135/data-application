import User from '../models/user.model.js';
import GymAdmission from '../models/gymAdmission.model.js';
import Membership from '../models/membership.model.js';
import Payment from '../models/payment.model.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import BodyMeasurement from '../models/bodyMeasurement.model.js';

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
  const [totalUsers, totalAdmitted, activeMemberships, expiredMemberships, totalOrders, pendingOrders, totalProducts, gymRevenueAgg, storeRevenueAgg, todayRevenueAgg, monthRevenueAgg, expiringMemberships, lowStockProducts, recentOrders, recentPayments] = await Promise.all([
    User.countDocuments(),
    GymAdmission.countDocuments({ status: 'active' }),
    Membership.countDocuments({ status: 'active' }),
    Membership.countDocuments({ status: 'expired' }),
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending', payment_status: 'pending' }),
    Product.countDocuments({ is_active: true }),
    Payment.aggregate([{ $match: { status: 'success', payment_type: { $in: ['membership_full', 'membership_advance', 'membership_installment'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payment.aggregate([{ $match: { status: 'success', payment_type: 'order' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payment.aggregate([{ $match: { status: 'success', payment_date: { $gte: todayStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payment.aggregate([{ $match: { status: 'success', payment_date: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Membership.find({ status: 'active', end_date: { $gte: now, $lte: twoDaysFromNow } }).populate({ path: 'user_id', select: 'full_name email' }).sort({ end_date: 1 }).limit(10).lean(),
    Product.find({ is_active: true, stock_quantity: { $lte: 10 } }).select('name stock_quantity').sort({ stock_quantity: 1 }).limit(10).lean(),
    Order.find().populate({ path: 'user_id', select: 'full_name email' }).sort({ createdAt: -1 }).limit(8).lean(),
    Payment.find().populate({ path: 'user_id', select: 'full_name email' }).sort({ createdAt: -1 }).limit(8).lean(),
  ]);
  const gymRevenue = gymRevenueAgg[0]?.total || 0; const storeRevenue = storeRevenueAgg[0]?.total || 0;
  return {
    stats: { totalUsers, totalAdmitted, notAdmitted: Math.max(0, totalUsers - totalAdmitted), activeMemberships, expiredMemberships, totalOrders, pendingOrders, totalProducts, gymRevenue, storeRevenue, totalRevenue: gymRevenue + storeRevenue, todayRevenue: todayRevenueAgg[0]?.total || 0, monthRevenue: monthRevenueAgg[0]?.total || 0 },
    expiringMemberships, lowStockProducts, recentOrders, recentPayments,
  };
}

export async function getRevenueAnalytics(period) {
  const now = new Date(); let startDate; let groupFormat;
  switch (period) {
    case '7d': startDate = new Date(now); startDate.setDate(startDate.getDate() - 6); groupFormat = '%Y-%m-%d'; break;
    case '30d': startDate = new Date(now); startDate.setDate(startDate.getDate() - 29); groupFormat = '%Y-%m-%d'; break;
    case '3m': startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 2); groupFormat = '%Y-%m'; break;
    case '6m': startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 5); groupFormat = '%Y-%m'; break;
    case '1y': startDate = new Date(now); startDate.setFullYear(startDate.getFullYear() - 1); groupFormat = '%Y-%m'; break;
    default: startDate = new Date(now); startDate.setDate(startDate.getDate() - 29); groupFormat = '%Y-%m-%d';
  }
  startDate.setHours(0, 0, 0, 0);
  const groupStage = { $dateToString: { format: groupFormat, date: '$payment_date', timezone: TIMEZONE } };
  const [gymData, storeData] = await Promise.all([
    Payment.aggregate([{ $match: { status: 'success', payment_type: { $in: ['membership_full', 'membership_advance', 'membership_installment'] }, payment_date: { $gte: startDate } } }, { $group: { _id: groupStage, total: { $sum: '$amount' } } }, { $sort: { _id: 1 } }]),
    Payment.aggregate([{ $match: { status: 'success', payment_type: 'order', payment_date: { $gte: startDate } } }, { $group: { _id: groupStage, total: { $sum: '$amount' } } }, { $sort: { _id: 1 } }]),
  ]);
  return { gymRevenue: gymData.map((d) => ({ date: d._id, amount: d.total })), storeRevenue: storeData.map((d) => ({ date: d._id, amount: d.total })) };
}

export async function getUserDashboard(userId) {
  const [memberships, payments, orders, measurements, admission] = await Promise.all([
    Membership.find({ user_id: userId }).lean(),
    Payment.find({ user_id: userId }).sort({ createdAt: -1 }).lean(),
    Order.find({ user_id: userId }).sort({ createdAt: -1 }).lean(),
    BodyMeasurement.find({ user_id: userId }).sort({ measurement_date: -1 }).lean(),
    GymAdmission.findOne({ user_id: userId }).lean(),
  ]);
  return { memberships, payments, orders, measurements, admission };
}
