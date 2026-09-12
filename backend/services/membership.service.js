import Membership from '../models/membership.model.js';
import MembershipPlan from '../models/membershipPlan.model.js';
import Payment from '../models/payment.model.js';
import GymAdmission from '../models/gymAdmission.model.js';
import { ApiError } from '../utils/errors.utils.js';

function dateOnly(date) { return new Date(date).toISOString().split('T')[0]; }

function nextStartDate(membership) {
  const today = new Date();
  const end = membership?.end_date ? new Date(membership.end_date) : null;
  if ((membership?.status === 'active' || membership?.status === 'scheduled') && end && end >= today) {
    end.setDate(end.getDate() + 1);
    return end;
  }
  return today;
}

export async function getMembershipsByUserId(userId) { return Membership.find({ user_id: userId }).sort({ createdAt: -1 }); }
export async function getAllMemberships() { return Membership.find().populate({ path: 'user_id', select: 'full_name email' }).sort({ createdAt: -1 }); }
export async function getActivePlans() { return MembershipPlan.find({ is_active: true }).sort({ display_order: 1 }); }

export async function getAdvancePaid(userId, membershipId) {
  const payments = await Payment.find({ user_id: userId, membership_id: membershipId, payment_type: 'membership_advance', status: 'success' });
  return payments.reduce((sum, payment) => sum + payment.amount, 0);
}

async function ensureNoPendingMembership(userId) {
  const pending = await Membership.findOne({ user_id: userId, status: 'pending' });
  if (pending) throw new ApiError(409, 'You already have a pending membership payment. Complete it before creating another.');
}

export async function purchaseMembership(userId, planId) {
  const plan = await MembershipPlan.findOne({ _id: planId, is_active: true });
  if (!plan) throw new ApiError(404, 'Plan not found');
  const admission = await GymAdmission.findOne({ user_id: userId, status: 'active' });
  if (!admission) throw new ApiError(400, 'No active gym admission found. Ask gym staff to admit you first.');
  await ensureNoPendingMembership(userId);
  const active = await Membership.findOne({ user_id: userId, status: { $in: ['active', 'scheduled'] } });
  if (active) throw new ApiError(409, 'You already have an active or scheduled membership. Use renewal instead.');
  return Membership.create({ user_id: userId, gym_admission_id: admission._id, plan_id: plan._id, plan_name_snapshot: plan.name, plan_price_snapshot: plan.price, duration_days: plan.duration_days, status: 'pending', payment_status: 'pending' });
}

export async function payAdvance() {
  throw new ApiError(400, 'Membership advance payment flow is disabled; use the full membership payment flow.');
}

export async function renewMembership(userId, membershipId) {
  const oldMembership = await Membership.findOne({ _id: membershipId, user_id: userId });
  if (!oldMembership) throw new ApiError(404, 'Membership not found');
  const plan = await MembershipPlan.findOne({ _id: oldMembership.plan_id, is_active: true });
  if (!plan) throw new ApiError(404, 'Original plan not found');
  await ensureNoPendingMembership(userId);
  if (oldMembership.status === 'active' || oldMembership.status === 'scheduled') {
    const otherActive = await Membership.findOne({ user_id: userId, status: { $in: ['active', 'scheduled'] }, _id: { $ne: oldMembership._id } });
    if (otherActive) throw new ApiError(409, 'Another active or scheduled membership already exists');
  }
  const startDate = nextStartDate(oldMembership);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.duration_days);
  return Membership.create({ user_id: userId, gym_admission_id: oldMembership.gym_admission_id, plan_id: plan._id, plan_name_snapshot: plan.name, plan_price_snapshot: plan.price, duration_days: plan.duration_days, start_date: startDate, end_date: endDate, status: 'pending', payment_status: 'pending' });
}
