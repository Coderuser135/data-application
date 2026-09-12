import mongoose from 'mongoose';
import GymAdmission from '../models/gymAdmission.model.js';
import MembershipPlan from '../models/membershipPlan.model.js';
import Membership from '../models/membership.model.js';
import BodyMeasurement from '../models/bodyMeasurement.model.js';
import Payment from '../models/payment.model.js';
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { generateMemberId } from '../utils/generators.utils.js';
import { ApiError } from '../utils/errors.utils.js';

export async function getAllAdmissions() {
  return GymAdmission.find().populate({ path: 'user_id', select: 'full_name email phone' }).populate({ path: 'selected_plan_id', select: 'name' }).sort({ createdAt: -1 });
}

export async function getAdmissionByUserId(userId) {
  return GymAdmission.findOne({ user_id: userId }).populate({ path: 'selected_plan_id', select: 'name price duration_days' });
}

export async function searchUsers(query, page = 1, limit = 20) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const filter = {};
  if (query) filter.$or = [{ full_name: { $regex: String(query).slice(0, 100), $options: 'i' } }, { email: { $regex: String(query).slice(0, 100), $options: 'i' } }, { phone: { $regex: String(query).slice(0, 100), $options: 'i' } }];
  const skip = (safePage - 1) * safeLimit;
  const [users, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(), User.countDocuments(filter)]);
  const userIds = users.map((u) => u._id);
  const admissions = await GymAdmission.find({ user_id: { $in: userIds } }).lean();
  const admissionMap = new Map(admissions.map((a) => [a.user_id.toString(), a]));
  const rows = users.map((u) => ({ _id: u._id, full_name: u.full_name, email: u.email, phone: u.phone, role: u.role, member_id: admissionMap.get(u._id.toString())?.member_id || null, is_admitted: !!admissionMap.get(u._id.toString()), admission_status: admissionMap.get(u._id.toString())?.status || null }));
  return { rows, total, page: safePage, pages: Math.ceil(total / safeLimit) };
}

export async function createAdmission(data) {
  const { user_id, emergency_contact_name, emergency_contact_phone, notes, selected_plan_id, measurement, payment_method, payment_amount } = data;
  if (!user_id) throw new ApiError(400, 'User is required');
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const user = await User.findById(user_id).session(session);
      if (!user) throw new ApiError(404, 'User not found');
      const existing = await GymAdmission.findOne({ user_id }).session(session);
      if (existing) throw new ApiError(409, 'User already has a gym admission');

      let member_id;
      for (let attempts = 0; attempts < 5; attempts++) {
        const candidate = generateMemberId();
        if (!(await GymAdmission.exists({ member_id: candidate }).session(session))) { member_id = candidate; break; }
      }
      if (!member_id) throw new ApiError(500, 'Failed to generate unique member ID');

      const admission = new GymAdmission({ user_id, member_id, emergency_contact_name: emergency_contact_name || '', emergency_contact_phone: emergency_contact_phone || '', notes: notes || '', selected_plan_id: selected_plan_id || null });
      await admission.save({ session });

      if (measurement) {
        const numeric = (value, label, max = Number.POSITIVE_INFINITY) => {
          if (value === undefined || value === null || value === '') return 0;
          const n = Number(value);
          if (!Number.isFinite(n) || n < 0 || n > max) throw new ApiError(400, `Invalid ${label}`);
          return n;
        };
        const measurementDoc = new BodyMeasurement({ user_id, gym_admission_id: admission._id, age: numeric(measurement.age, 'age', 120), height: numeric(measurement.height, 'height', 300), weight: numeric(measurement.weight, 'weight', 500), stomach: numeric(measurement.stomach, 'stomach', 300), chest: numeric(measurement.chest, 'chest', 300), biceps: numeric(measurement.biceps, 'biceps', 150), back: numeric(measurement.back, 'back', 300), legs: numeric(measurement.legs, 'legs', 300), body_fat: numeric(measurement.body_fat, 'body fat', 100), muscle_mass: numeric(measurement.muscle_mass, 'muscle mass', 500), notes: String(measurement.notes || '').slice(0, 2000), measurement_date: measurement.measurement_date ? new Date(measurement.measurement_date) : new Date() });
        if (Number.isNaN(measurementDoc.measurement_date.getTime())) throw new ApiError(400, 'Invalid measurement date');
        await measurementDoc.save({ session });
      }

      let membership = null;
      let payment = null;
      if (selected_plan_id) {
        const plan = await MembershipPlan.findOne({ _id: selected_plan_id, is_active: true }).session(session);
        if (!plan) throw new ApiError(404, 'Selected plan not found or inactive');
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.duration_days);
        membership = new Membership({ user_id, gym_admission_id: admission._id, plan_id: plan._id, plan_name_snapshot: plan.name, plan_price_snapshot: plan.price, duration_days: plan.duration_days, start_date: startDate, end_date: endDate, status: 'pending' });
        await membership.save({ session });

        const method = payment_method || 'cash';
        const amount = payment_amount === undefined || payment_amount === '' ? plan.price : Number(payment_amount);
        if (!Number.isFinite(amount) || amount <= 0 || amount > plan.price) throw new ApiError(400, 'Invalid payment amount');
        if (!['cash', 'other', 'online'].includes(method)) throw new ApiError(400, 'Invalid payment method');
        payment = new Payment({ user_id, membership_id: membership._id, amount, payment_type: 'membership_full', payment_method: method, status: method === 'online' ? 'pending' : 'success', payment_date: method === 'online' ? undefined : new Date() });
        await payment.save({ session });
        if (method !== 'online') {
          membership.status = 'active';
          await membership.save({ session });
        }
      }

      const admissionNotification = new Notification({ user_id, title: 'Gym Admission Confirmed', message: `Welcome to the gym! Your member ID is ${member_id}.`, type: 'admission', related_id: admission._id, related_type: 'GymAdmission' });
      await admissionNotification.save({ session });
      if (membership?.status === 'active') {
        const membershipNotification = new Notification({ user_id, title: 'Membership Activated', message: `Your ${membership.plan_name_snapshot} membership is now active.`, type: 'membership', related_id: membership._id, related_type: 'Membership' });
        await membershipNotification.save({ session });
      }
      result = { admission, membership, payment, member_id };
    });
    return result;
  } finally { await session.endSession(); }
}

export async function updateAdmission(admissionId, data) {
  const allowed = ['emergency_contact_name', 'emergency_contact_phone', 'notes', 'status', 'selected_plan_id'];
  const update = Object.fromEntries(Object.entries(data || {}).filter(([key]) => allowed.includes(key)));
  if (update.status && !['active', 'inactive'].includes(update.status)) throw new ApiError(400, 'Invalid admission status');
  const admission = await GymAdmission.findByIdAndUpdate(admissionId, update, { new: true, runValidators: true });
  if (!admission) throw new ApiError(404, 'Admission not found');
  return admission;
}
