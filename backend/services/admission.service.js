import GymAdmission from '../models/gymAdmission.model.js';
import BodyMeasurement from '../models/bodyMeasurement.model.js';
import Payment from '../models/payment.model.js';
import Membership from '../models/membership.model.js';
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import MembershipPlan from '../models/membershipPlan.model.js';
import { generateMemberId } from '../utils/generators.utils.js';
import { ApiError } from '../utils/errors.utils.js';

export async function getAllAdmissions() {
  return GymAdmission.find()
    .populate({ path: 'user_id', select: 'full_name email phone address role' })
    .populate({ path: 'selected_plan_id', select: 'name' })
    .sort({ createdAt: -1 });
}

export async function getAdmissionDetails(admissionId) {
  if (!/^[a-f\d]{24}$/i.test(String(admissionId))) {
    throw new ApiError(400, 'Invalid admission ID');
  }

  const admission = await GymAdmission.findById(admissionId)
    .populate({ path: 'user_id', select: 'full_name email phone address role email_verified createdAt' })
    .populate({ path: 'selected_plan_id', select: 'name description price duration_days' })
    .lean();

  if (!admission) throw new ApiError(404, 'Admission not found');

  const [measurements, payments, memberships] = await Promise.all([
    BodyMeasurement.find({ gym_admission_id: admission._id }).sort({ measurement_date: -1 }).lean(),
    Payment.find({ gym_admission_id: admission._id })
      .select('-razorpay_signature')
      .sort({ payment_date: -1 })
      .lean(),
    Membership.find({ gym_admission_id: admission._id })
      .populate({ path: 'plan_id', select: 'name price duration_days' })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return { admission, measurements, payments, memberships };
}

export async function getAdmissionByUserId(userId) {
  return GymAdmission.findOne({ user_id: userId })
    .populate({ path: 'selected_plan_id', select: 'name price duration_days' });
}

export async function searchUsers(query, page = 1, limit = 10, { excludeAdmins = false } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const requestedLimit = Number(limit);
  const safeLimit = [5, 10].includes(requestedLimit) ? requestedLimit : 10;
  const filter = excludeAdmins ? { role: 'user' } : {};

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
      email_verified: user.email_verified,
      member_id: admission?.member_id || null,
      admission_id: admission?._id || null,
      is_admitted: Boolean(admission),
      admission_status: admission?.status || null,
    };
  });

  return { rows, total, page: safePage, pages: Math.ceil(total / safeLimit) };
}

function requiredText(value, label, min, max) {
  const text = String(value ?? '').trim();
  if (text.length < min || text.length > max) throw new ApiError(400, `${label} must be between ${min} and ${max} characters`);
  return text;
}

function validIndianPhone(value, label, required = false) {
  const phone = String(value ?? '').replace(/[\s-]/g, '');
  if (!phone && !required) return '';
  if (!/^(?:\+91)?[6-9]\d{9}$/.test(phone)) throw new ApiError(400, `${label} must be a valid Indian mobile number`);
  return phone;
}

function measurementNumber(value, label, min, max) {
  if (value === undefined || value === null || value === '') return 0;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new ApiError(400, `${label} must be between ${min} and ${max}`);
  return number;
}

function validateMeasurement(measurement) {
  if (measurement === undefined || measurement === null) return null;
  if (typeof measurement !== 'object' || Array.isArray(measurement)) throw new ApiError(400, 'Measurement must be an object');
  const hasValue = Object.entries(measurement).some(([key, value]) => !['notes', 'measurement_date'].includes(key) && value !== '' && value !== null && value !== undefined);
  if (!hasValue) return null;
  const dateValue = measurement.measurement_date ? String(measurement.measurement_date) : '';
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) throw new ApiError(400, 'Measurement date is invalid');
  const todayInIndia = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  if (dateValue && dateValue.slice(0, 10) > todayInIndia) throw new ApiError(400, 'Measurement date cannot be in the future');
  return {
    age: measurementNumber(measurement.age, 'Age', 13, 100),
    height: measurementNumber(measurement.height, 'Height (cm)', 50, 250),
    weight: measurementNumber(measurement.weight, 'Weight (kg)', 20, 300),
    stomach: measurementNumber(measurement.stomach, 'Stomach (inches)', 1, 300),
    chest: measurementNumber(measurement.chest, 'Chest (inches)', 1, 300),
    biceps: measurementNumber(measurement.biceps, 'Biceps (inches)', 1, 100),
    back: measurementNumber(measurement.back, 'Back (inches)', 1, 300),
    legs: measurementNumber(measurement.legs, 'Legs (inches)', 1, 300),
    body_fat: measurementNumber(measurement.body_fat, 'Body fat (%)', 0, 75),
    muscle_mass: measurementNumber(measurement.muscle_mass, 'Muscle mass (kg)', 1, 300),
    notes: String(measurement.notes || '').trim(),
    measurement_date: date,
  };
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

  if (!user_id || !/^[a-f\d]{24}$/i.test(String(user_id))) throw new ApiError(400, 'A valid user is required');
  const emergencyName = String(emergency_contact_name || '').trim();
  const emergencyPhone = validIndianPhone(emergency_contact_phone, 'Emergency contact phone');
  if (emergencyName && (emergencyName.length < 2 || emergencyName.length > 100 || !/^[\p{L}][\p{L}\p{N} .'-]*$/u.test(emergencyName))) throw new ApiError(400, 'Emergency contact name is invalid');
  if (Boolean(emergencyName) !== Boolean(emergencyPhone)) throw new ApiError(400, 'Provide both emergency contact name and phone, or leave both empty');
  const admissionNotes = String(notes || '').trim();
  if (admissionNotes.length > 2000) throw new ApiError(400, 'Admission notes cannot exceed 2000 characters');

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

  const details = personal_details && typeof personal_details === 'object' && !Array.isArray(personal_details) ? personal_details : {};
  const memberName = requiredText(details.full_name ?? full_name ?? '', 'Full name', 2, 100);
  if (!/^[\p{L}][\p{L}\p{N} .'-]*$/u.test(memberName)) throw new ApiError(400, 'Full name contains invalid characters');
  const memberPhone = validIndianPhone(details.phone ?? phone, 'Phone number', true);
  const memberAddress = requiredText(details.address ?? address ?? '', 'Address', 5, 1000);
  const user = await User.findById(user_id);

  if (!user) throw new ApiError(404, 'User not found');
  if (user.role !== 'user') throw new ApiError(400, 'Only customer accounts can receive a gym admission');
  if (!user.email_verified) throw new ApiError(409, 'User must verify their email before gym admission');

  const existing = await GymAdmission.findOne({ user_id });
  if (existing) throw new ApiError(409, 'User already has a gym admission');

  // Measurements are optional; every supplied value is validated before database writes.
  const validatedMeasurement = validateMeasurement(measurement);
  let measurementDoc = validatedMeasurement ? new BodyMeasurement({ user_id, ...validatedMeasurement }) : null;

  let member_id;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateMemberId();
    if (!(await GymAdmission.exists({ member_id: candidate }))) {
      member_id = candidate;
      break;
    }
  }

  if (!member_id) throw new ApiError(500, 'Failed to generate unique member ID');

  const admission = new GymAdmission({
    user_id,
    member_id,
    status: 'active',
    emergency_contact_name: emergencyName,
    emergency_contact_phone: emergencyPhone,
    notes: admissionNotes,
    selected_plan_id: null,
  });

  let advancePayment = null;
  let notification = null;
  let admissionSaved = false;
  let measurementSaved = false;
  let paymentSaved = false;
  let notificationSaved = false;

  try {
    // Use ordinary MongoDB writes; no replica set or transaction is required.
    await admission.save();
    admissionSaved = true;

    if (measurementDoc) {
      measurementDoc.gym_admission_id = admission._id;
      await measurementDoc.save();
      measurementSaved = true;
    }

    if (amount > 0) {
      advancePayment = new Payment({
        user_id,
        membership_id: null,
        gym_admission_id: admission._id,
        amount,
        allocated_amount: 0,
        payment_type: 'membership_advance',
        payment_method,
        status: 'success',
        payment_date: new Date(),
        reference_note: 'Advance received during gym admission; will be adjusted against the first membership selected by the member.',
      });

      await advancePayment.save();
      paymentSaved = true;
    }

    notification = new Notification({
      user_id,
      title: 'Gym Admission Confirmed',
      message: `Welcome to the gym! Your member ID is ${member_id}. You can now choose a membership plan from your dashboard.`,
      type: 'admission',
      related_id: admission._id,
      related_type: 'GymAdmission',
    });

    await notification.save();
    notificationSaved = true;

    user.full_name = memberName;
    user.phone = memberPhone;
    user.address = memberAddress;
    await user.save();

    return { admission, membership: null, payment: advancePayment, member_id };
  } catch (error) {
    // Compensate for a failed later write by removing records created by this request.
    const cleanupTasks = [];

    if (notificationSaved) cleanupTasks.push(Notification.deleteOne({ _id: notification._id }));
    if (paymentSaved) cleanupTasks.push(Payment.deleteOne({ _id: advancePayment._id }));
    if (measurementSaved) cleanupTasks.push(BodyMeasurement.deleteOne({ _id: measurementDoc._id }));
    if (admissionSaved) cleanupTasks.push(GymAdmission.deleteOne({ _id: admission._id }));

    const cleanupResults = await Promise.allSettled(cleanupTasks);
    const cleanupFailed = cleanupResults.some((result) => result.status === 'rejected');

    if (cleanupFailed) {
      console.error('Admission cleanup failed; manual database review is required.', {
        admissionId: admission._id,
        originalError: error,
      });
      throw new ApiError(500, 'Admission could not be completed and automatic cleanup was incomplete. Please check admin records before retrying.');
    }

    if (error?.code === 11000) {
      throw new ApiError(409, 'This user already has an admission or the generated member ID is already in use. Refresh and try again.');
    }

    throw error;
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
