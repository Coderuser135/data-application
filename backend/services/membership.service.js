import Membership from '../models/membership.model.js';
import MembershipPlan from '../models/membershipPlan.model.js';
import Payment from '../models/payment.model.js';
import GymAdmission from '../models/gymAdmission.model.js';
import { ApiError } from '../utils/errors.utils.js';

function dateOnly(date) {
  return new Date(date).toISOString().split('T')[0];
}

function nextStartDate(membership) {
  const today = new Date();
  const end = membership?.end_date ? new Date(membership.end_date) : null;
  if (membership?.status === 'active' && end && end >= today) {
    end.setDate(end.getDate() + 1);
    return end;
  }
  return today;
}

export async function getMembershipsByUserId(userId) {
  return Membership.find({ user_id: userId }).sort({ createdAt: -1 });
}

export async function getAllMemberships() {
  return Membership.find().populate({ path: 'user_id', select: 'full_name email' }).sort({ createdAt: -1 });
}

export async function getActivePlans() {
  return MembershipPlan.find({ is_active: true }).sort({ display_order: 1 });
}

export async function getAdvancePaid(userId, membershipId) {
  const filter = { user_id: userId, membership_id: membershipId, payment_type: 'membership_advance', status: 'success' };
  const payments = await Payment.find(filter);
  return payments.reduce((sum, payment) => sum + payment.amount, 0);
}

export async function purchaseMembership(userId, planId) {
  const plan = await MembershipPlan.findOne({ _id: planId, is_active: true });
  if (!plan) throw new ApiError(404, 'Plan not found');
  const admission = await GymAdmission.findOne({ user_id: userId });
  if (!admission) throw new ApiError(400, 'No gym admission found. Ask gym staff to admit you first.');

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.duration_days);
  return Membership.create({
    user_id: userId,
    gym_admission_id: admission._id,
    plan_id: plan._id,
    plan_name_snapshot: plan.name,
    plan_price_snapshot: plan.price,
    duration_days: plan.duration_days,
    start_date: dateOnly(startDate),
    end_date: dateOnly(endDate),
    status: 'pending',
  });
}

export async function payAdvance(userId, membershipId) {
  const membership = await Membership.findOne({ _id: membershipId, user_id: userId });
  if (!membership) throw new ApiError(404, 'Membership not found');
  const advanceAmount = Number(process.env.MEMBERSHIP_ADVANCE_AMOUNT || 0);
  if (advanceAmount <= 0) throw new ApiError(400, 'Membership advance payments are not enabled');
  const paid = await getAdvancePaid(userId, membership._id);
  if (paid >= advanceAmount) throw new ApiError(400, 'Advance already paid for this membership');
  return Payment.create({
    user_id: userId,
    membership_id: membership._id,
    amount: Math.min(advanceAmount - paid, membership.plan_price_snapshot),
    payment_type: 'membership_advance',
    payment_method: 'online',
    status: 'pending',
  });
}

export async function renewMembership(userId, membershipId) {
  const oldMembership = await Membership.findOne({ _id: membershipId, user_id: userId });
  if (!oldMembership) throw new ApiError(404, 'Membership not found');
  const plan = await MembershipPlan.findOne({ _id: oldMembership.plan_id, is_active: true });
  if (!plan) throw new ApiError(404, 'Original plan not found');

  const startDate = nextStartDate(oldMembership);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.duration_days);
  return Membership.create({
    user_id: userId,
    gym_admission_id: oldMembership.gym_admission_id,
    plan_id: plan._id,
    plan_name_snapshot: plan.name,
    plan_price_snapshot: plan.price,
    duration_days: plan.duration_days,
    start_date: dateOnly(startDate),
    end_date: dateOnly(endDate),
    status: 'pending',
  });
}
