import mongoose from 'mongoose';
import GymAdmission from '../models/gymAdmission.model.js';
import BodyMeasurement from '../models/bodyMeasurement.model.js';
import Payment from '../models/payment.model.js';
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import MembershipPlan from '../models/membershipPlan.model.js';
import { generateMemberId } from '../utils/generators.utils.js';
import { ApiError } from '../utils/errors.utils.js';

export async function getAllAdmissions() {
  return GymAdmission.find()
    .populate({ path: 'user_id', select: 'full_name email phone address' })
    .populate({ path: 'selected_plan_id', select: 'name' })
    .sort({ createdAt: -1 });
}

export async function getAdmissionByUserId(userId) {
  return GymAdmission.findOne({ user_id: userId })
    .populate({ path: 'selected_plan_id', select: 'name price duration_days' });
}

export async function searchUsers(query, page = 1, limit = 20) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const filter = {};
  if (query) {
    const safeQuery = String(query).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { full_name: { $regex: safeQuery, $options: 'i' } },
      { email: { $regex: safeQuery, $options: 'i' } },
      { phone: { $regex: safeQuery, $options: 'i' } },
    ];
  }
  const skip = (safePage - 1) * safeLimit;
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    User.countDocuments(filter),
  ]);
  const userIds = users.map((user) => user._id);
  const admissions = await GymAdmission.find({ user_id: { $in: userIds } }).lean();
  const admissionMap = new Map(admissions.map((admission) => [admission.user_id.toString(), admission]));
  const rows = users.map((user) => {
    const admission = admissionMap.get(user._id.toString());
    return {
      _id: user._id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      member_id: admission?.member_id || null,
      is_admitted: Boolean(admission),
      admission_status: admission?.status || null,
    };
  });
  return { rows, total, page: safePage, pages: Math.ceil(total / safeLimit) };
}

function measurementNumber(value, label, max = Number.POSITIVE_INFINITY) {
  if (value === undefined || value === null || value === '') return 0;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > max) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return number;
}

export async function createAdmission(data) {
  const {
    user_id,
    emergency_contact_name,
    emergency_contact_phone,
    notes,
    measurement,
    payment_method,
    payment_amount,
    personal_details,
    full_name,
    phone,
    address,
  } = data || {};

  if (!user_id) throw new ApiError(400, 'User is required');

  const amount = payment_amount === undefined || payment_amount === null || payment_amount === ''
    ? 0
    : Number(payment_amount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new ApiError(400, 'Admission advance amount must be zero or a positive number');
  }

  if (amount > 0) {
    const lowestPricedPlan = await MembershipPlan.findOne({ is_active: true })
      .sort({ price: 1 })
      .select('name price')
      .lean();

    if (!lowestPricedPlan) {
      throw new ApiError(400, 'No active membership plan is available. Activate a membership plan before receiving an advance.');
    }

    if (amount > lowestPricedPlan.price) {
      throw new ApiError(
        400,
        `Advance amount cannot exceed the lowest active membership plan price (${lowestPricedPlan.name}: ₹${lowestPricedPlan.price}).`,
      );
    }
  }

  if (amount > 0 && !['cash', 'online', 'other'].includes(payment_method)) {
    throw new ApiError(400, 'Select a valid payment method for the advance received');
  }

  const details = personal_details && typeof personal_details === 'object' ? personal_details : {};
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const user = await User.findById(user_id).session(session);
      if (!user) throw new ApiError(404, 'User not found');
      if (!user.email_verified) throw new ApiError(409, 'User must verify their email before gym admission');

      const existing = await GymAdmission.findOne({ user_id }).session(session);
      if (existing) throw new ApiError(409, 'User already has a gym admission');

      let member_id;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = generateMemberId();
        if (!(await GymAdmission.exists({ member_id: candidate }).session(session))) {
          member_id = candidate;
          break;
        }
      }
      if (!member_id) throw new ApiError(500, 'Failed to generate unique member ID');

      const updatedName = String(details.full_name ?? full_name ?? user.full_name).trim().slice(0, 100);
      const updatedPhone = String(details.phone ?? phone ?? user.phone).trim().slice(0, 30);
      const updatedAddress = String(details.address ?? address ?? user.address).trim().slice(0, 1000);
      user.full_name = updatedName;
      user.phone = updatedPhone;
      user.address = updatedAddress;
      await user.save({ session });

      const admission = new GymAdmission({
        user_id,
        member_id,
        status: 'active',
        emergency_contact_name: String(emergency_contact_name || '').trim().slice(0, 100),
        emergency_contact_phone: String(emergency_contact_phone || '').trim().slice(0, 30),
        notes: String(notes || '').slice(0, 2000),
        selected_plan_id: null,
      });
      await admission.save({ session });

      if (measurement && typeof measurement === 'object') {
        const measurementDoc = new BodyMeasurement({
          user_id,
          gym_admission_id: admission._id,
          age: measurementNumber(measurement.age, 'age', 120),
          height: measurementNumber(measurement.height, 'height', 300),
          weight: measurementNumber(measurement.weight, 'weight', 500),
          stomach: measurementNumber(measurement.stomach, 'stomach', 300),
          chest: measurementNumber(measurement.chest, 'chest', 300),
          biceps: measurementNumber(measurement.biceps, 'biceps', 150),
          back: measurementNumber(measurement.back, 'back', 300),
          legs: measurementNumber(measurement.legs, 'legs', 300),
          body_fat: measurementNumber(measurement.body_fat, 'body fat', 100),
          muscle_mass: measurementNumber(measurement.muscle_mass, 'muscle mass', 500),
          notes: String(measurement.notes || '').slice(0, 2000),
          measurement_date: measurement.measurement_date ? new Date(measurement.measurement_date) : new Date(),
        });
        if (Number.isNaN(measurementDoc.measurement_date.getTime())) {
          throw new ApiError(400, 'Invalid measurement date');
        }
        await measurementDoc.save({ session });
      }

      let advancePayment = null;
      if (amount > 0) {
        advancePayment = new Payment({
          user_id,
          membership_id: null,
          amount,
          allocated_amount: 0,
          payment_type: 'membership_advance',
          payment_method,
          status: 'success',
          payment_date: new Date(),
          reference_note: 'Advance received during gym admission; will be adjusted against the first membership selected by the member.',
        });
        await advancePayment.save({ session });
      }

      await new Notification({
        user_id,
        title: 'Gym Admission Confirmed',
        message: `Welcome to the gym! Your member ID is ${member_id}. You can now choose a membership plan from your dashboard.`,
        type: 'admission',
        related_id: admission._id,
        related_type: 'GymAdmission',
      }).save({ session });

      result = { admission, membership: null, payment: advancePayment, member_id };
    });
    return result;
  } finally {
    await session.endSession();
  }
}

export async function updateAdmission(admissionId, data) {
  const allowed = ['emergency_contact_name', 'emergency_contact_phone', 'notes', 'status'];
  const update = Object.fromEntries(Object.entries(data || {}).filter(([key]) => allowed.includes(key)));
  if (update.status && !['active', 'inactive'].includes(update.status)) {
    throw new ApiError(400, 'Invalid admission status');
  }
  const admission = await GymAdmission.findByIdAndUpdate(admissionId, update, { new: true, runValidators: true });
  if (!admission) throw new ApiError(404, 'Admission not found');
  return admission;
}
