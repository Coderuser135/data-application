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
  return GymAdmission.find()
    .populate({ path: 'user_id', select: 'full_name email phone' })
    .populate({ path: 'selected_plan_id', select: 'name' })
    .sort({ createdAt: -1 });
}

export async function getAdmissionByUserId(userId) {
  return GymAdmission.findOne({ user_id: userId })
    .populate({ path: 'selected_plan_id', select: 'name price duration_days' });
}

export async function searchUsers(query, page = 1, limit = 20) {
  const filter = {};
  if (query) {
    filter.$or = [
      { full_name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { phone: { $regex: query, $options: 'i' } },
    ];
  }
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  const userIds = users.map((u) => u._id);
  const admissions = await GymAdmission.find({ user_id: { $in: userIds } }).lean();
  const admissionMap = new Map(admissions.map((a) => [a.user_id.toString(), a]));

  const rows = users.map((u) => ({
    _id: u._id,
    full_name: u.full_name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    member_id: admissionMap.get(u._id.toString())?.member_id || null,
    is_admitted: !!admissionMap.get(u._id.toString()),
    admission_status: admissionMap.get(u._id.toString())?.status || null,
  }));

  return { rows, total, page, pages: Math.ceil(total / limit) };
}

export async function createAdmission(data) {
  const {
    user_id,
    emergency_contact_name,
    emergency_contact_phone,
    notes,
    selected_plan_id,
    measurement,
    payment_method,
    payment_amount,
  } = data;

  const user = await User.findById(user_id);
  if (!user) throw new ApiError(404, 'User not found');
  const existing = await GymAdmission.findOne({ user_id });
  if (existing) throw new ApiError(409, 'User already has a gym admission');

  let member_id;
  let attempts = 0;
  while (attempts < 5) {
    member_id = generateMemberId();
    const collision = await GymAdmission.findOne({ member_id });
    if (!collision) break;
    attempts++;
  }
  if (attempts >= 5) throw new ApiError(500, 'Failed to generate unique member ID');

  const admission = await GymAdmission.create({
    user_id,
    member_id,
    emergency_contact_name: emergency_contact_name || '',
    emergency_contact_phone: emergency_contact_phone || '',
    notes: notes || '',
    selected_plan_id: selected_plan_id || null,
  });

  if (measurement) {
    await BodyMeasurement.create({
      user_id,
      gym_admission_id: admission._id,
      age: Number(measurement.age) || 0,
      height: Number(measurement.height) || 0,
      weight: Number(measurement.weight) || 0,
      stomach: Number(measurement.stomach) || 0,
      chest: Number(measurement.chest) || 0,
      biceps: Number(measurement.biceps) || 0,
      back: Number(measurement.back) || 0,
      legs: Number(measurement.legs) || 0,
      body_fat: Number(measurement.body_fat) || 0,
      muscle_mass: Number(measurement.muscle_mass) || 0,
      notes: measurement.notes || '',
      measurement_date: measurement.measurement_date || new Date().toISOString().split('T')[0],
    });
  }

  let membership = null;
  let payment = null;

  if (selected_plan_id) {
    const plan = await MembershipPlan.findOne({ _id: selected_plan_id, is_active: true });
    if (!plan) throw new ApiError(404, 'Selected plan not found or inactive');

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration_days);

    membership = await Membership.create({
      user_id,
      gym_admission_id: admission._id,
      plan_id: plan._id,
      plan_name_snapshot: plan.name,
      plan_price_snapshot: plan.price,
      duration_days: plan.duration_days,
      start_date: startDate,
      end_date: endDate,
      status: 'pending',
    });

    const amount = Number(payment_amount) || plan.price;
    const method = payment_method || 'cash';

    if (method === 'cash' || method === 'other') {
      payment = await Payment.create({
        user_id,
        membership_id: membership._id,
        amount,
        payment_type: 'membership_full',
        payment_method: method,
        status: 'success',
        payment_date: new Date(),
      });
      membership.status = 'active';
      await membership.save();
    } else {
      payment = await Payment.create({
        user_id,
        membership_id: membership._id,
        amount,
        payment_type: 'membership_full',
        payment_method: 'online',
        status: 'pending',
      });
    }
  }

  await Notification.create({
    user_id,
    title: 'Gym Admission Confirmed',
    message: `Welcome to the gym! Your member ID is ${member_id}.`,
    type: 'admission',
    related_id: admission._id,
    related_type: 'GymAdmission',
  });

  if (membership && membership.status === 'active') {
    await Notification.create({
      user_id,
      title: 'Membership Activated',
      message: `Your ${membership.plan_name_snapshot} membership is now active.`,
      type: 'membership',
      related_id: membership._id,
      related_type: 'Membership',
    });
  }

  return {
    admission,
    membership,
    payment,
    member_id,
  };
}

export async function updateAdmission(admissionId, data) {
  const admission = await GymAdmission.findByIdAndUpdate(admissionId, data, { new: true });
  if (!admission) throw new ApiError(404, 'Admission not found');
  return admission;
}
