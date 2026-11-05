import GymAdmission from '../models/gymAdmission.model.js';
import BodyMeasurement from '../models/bodyMeasurement.model.js';
import Payment from '../models/payment.model.js';
import Membership from '../models/membership.model.js';
import Order from '../models/order.model.js';
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import MembershipPlan from '../models/membershipPlan.model.js';
import { generateMemberId } from '../utils/generators.utils.js';
import { ApiError } from '../utils/errors.utils.js';

export async function getAllAdmissions() {
  // Admissions belong to customer accounts only. Never expose an admin as a gym member.
  const customerIds = await User.distinct('_id', { role: 'user' });

  return GymAdmission.find({ user_id: { $in: customerIds } })
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
  if (!admission.user_id || admission.user_id.role !== 'user') throw new ApiError(404, 'Admission not found');

  // Read the original account registration timestamp directly from the User document.
  const registeredUser = await User.findById(admission.user_id?._id || admission.user_id)
    .select('createdAt')
    .lean();

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

  return { admission: { ...admission, user_id: { ...(admission.user_id || {}), registered_at: registeredUser?.createdAt || null } }, measurements, payments, memberships };
}

export async function getAdmissionByUserId(userId) {
  return GymAdmission.findOne({ user_id: userId })
    .populate({ path: 'selected_plan_id', select: 'name price duration_days' });
}

export async function searchUsers(query, page = 1, limit = 10, {
  admissionFilter = 'all',
  paymentFilter = 'all',
  membershipFilter = 'all',
  registeredWithin = 'all',
} = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const requestedLimit = Number(limit);
  const safeLimit = [5, 10, 20].includes(requestedLimit) ? requestedLimit : 10;
  const filter = { role: 'user' };
  const now = new Date();

  // Build filters from real related records, then intersect the matching customer IDs.
  const idSets = [];
  const admittedUserIds = await GymAdmission.distinct('user_id');

  if (admissionFilter === 'admitted') idSets.push(admittedUserIds);
  if (admissionFilter === 'not_admitted') idSets.push(await User.distinct('_id', { role: 'user', _id: { $nin: admittedUserIds } }));

  if (paymentFilter !== 'all') {
    const latestPayments = await Payment.aggregate([
      { $sort: { payment_date: -1, createdAt: -1 } },
      { $group: { _id: '$user_id', status: { $first: '$status' } } },
    ]);
    const matchingPaymentIds = latestPayments
      .filter((item) => item.status === paymentFilter)
      .map((item) => item._id);
    const usersWithPayments = latestPayments.map((item) => item._id);
    const paymentUserIds = paymentFilter === 'none'
      ? await User.distinct('_id', { role: 'user', _id: { $nin: usersWithPayments } })
      : matchingPaymentIds;
    idSets.push(paymentUserIds);
  }

  if (membershipFilter !== 'all') {
    const latestMemberships = await Membership.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$user_id', status: { $first: '$status' }, end_date: { $first: '$end_date' } } },
    ]);
    const usersWithMemberships = latestMemberships.map((item) => item._id);
    const matchingMembershipIds = latestMemberships
      .filter((item) => {
        const expired = item.status === 'expired' || (item.end_date && new Date(item.end_date) < now);
        const effectiveStatus = expired ? 'expired' : item.status;
        return effectiveStatus === membershipFilter;
      })
      .map((item) => item._id);
    const membershipUserIds = membershipFilter === 'not_purchased'
      ? await User.distinct('_id', { role: 'user', _id: { $nin: usersWithMemberships } })
      : matchingMembershipIds;
    idSets.push(membershipUserIds);
  }

  if (idSets.length) {
    const allowedIds = idSets.reduce((current, next) => {
      const nextSet = new Set(next.map((id) => id.toString()));
      return current.filter((id) => nextSet.has(id.toString()));
    }, idSets[0]);
    filter._id = { $in: allowedIds };
  }

  if (registeredWithin !== 'all') {
    const days = Number(registeredWithin);
    if ([7, 30, 90].includes(days)) {
      filter.createdAt = { $gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) };
    }
  }

  if (query) {
    const regexSpecialCharacters = new Set(['.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']', String.fromCharCode(92)]);
    const safeQuery = [...String(query).slice(0, 100)].map((character) => regexSpecialCharacters.has(character) ? String.fromCharCode(92) + character : character).join('');
    const matchingAdmissionUsers = await GymAdmission.find({ member_id: { $regex: safeQuery, $options: 'i' } }).distinct('user_id');
    filter.$or = [
      { full_name: { $regex: safeQuery, $options: 'i' } },
      { email: { $regex: safeQuery, $options: 'i' } },
      { phone: { $regex: safeQuery, $options: 'i' } },
      { _id: { $in: matchingAdmissionUsers } },
    ];
  }

  const skip = (safePage - 1) * safeLimit;
  const [users, total, totalCustomerUsers] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    User.countDocuments(filter),
    User.countDocuments({ role: 'user' }),
  ]);

  const userIds = users.map((user) => user._id);
  const [admissions, memberships, payments, admittedCustomerCount] = await Promise.all([
    GymAdmission.find({ user_id: { $in: userIds } }).lean(),
    Membership.find({ user_id: { $in: userIds } }).sort({ createdAt: -1 }).lean(),
    Payment.find({ user_id: { $in: userIds } }).sort({ payment_date: -1, createdAt: -1 }).lean(),
    User.countDocuments({ role: 'user', _id: { $in: admittedUserIds } }),
  ]);
  const admissionMap = new Map(admissions.map((item) => [item.user_id.toString(), item]));
  const membershipMap = new Map();
  for (const item of memberships) {
    const key = item.user_id.toString();
    if (!membershipMap.has(key)) membershipMap.set(key, []);
    membershipMap.get(key).push(item);
  }
  const paymentMap = new Map();
  for (const item of payments) {
    const key = item.user_id.toString();
    if (!paymentMap.has(key)) paymentMap.set(key, []);
    paymentMap.get(key).push(item);
  }

  const rows = users.map((user) => {
    const admission = admissionMap.get(user._id.toString());
    const userMemberships = membershipMap.get(user._id.toString()) || [];
    const currentMembership = userMemberships.find((item) => item.status === 'active' && (!item.end_date || new Date(item.end_date) >= now))
      || userMemberships.find((item) => item.status === 'scheduled')
      || userMemberships[0]
      || null;
    const userPayments = paymentMap.get(user._id.toString()) || [];
    const latestPayment = userPayments[0] || null;
    let effectiveMembershipStatus = currentMembership?.status || 'not_purchased';
    if (currentMembership?.end_date && new Date(currentMembership.end_date) < now) effectiveMembershipStatus = 'expired';

    return {
      _id: user._id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      email_verified: user.email_verified,
      created_at: user.createdAt || null,
      member_id: admission?.member_id || null,
      admission_id: admission?._id || null,
      is_admitted: Boolean(admission),
      admission_status: admission?.status || null,
      membership_status: effectiveMembershipStatus,
      membership_plan: currentMembership?.plan_name_snapshot || null,
      membership_end_date: currentMembership?.end_date || null,
      payment_status: latestPayment?.status || 'none',
      latest_payment_amount: latestPayment?.amount ?? null,
      latest_payment_date: latestPayment?.payment_date || latestPayment?.createdAt || null,
    };
  });

  return {
    rows,
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit),
    stats: {
      totalUsers: totalCustomerUsers,
      admitted: admittedCustomerCount,
      notAdmitted: totalCustomerUsers - admittedCustomerCount,
    },
  };
}

export async function getMemberOverview(userId) {
  if (!/^[a-f\\d]{24}$/i.test(String(userId))) throw new ApiError(400, 'Invalid user ID');
  const user = await User.findOne({ _id: userId, role: 'user' })
    .select('full_name email phone address email_verified createdAt')
    .lean();
  if (!user) throw new ApiError(404, 'Customer not found');

  const [admission, memberships, payments, orders, measurements] = await Promise.all([
    GymAdmission.findOne({ user_id: user._id }).lean(),
    Membership.find({ user_id: user._id }).sort({ createdAt: -1 }).lean(),
    Payment.find({ user_id: user._id }).select('-razorpay_signature').sort({ payment_date: -1, createdAt: -1 }).lean(),
    Order.find({ user_id: user._id }).sort({ createdAt: -1 }).lean(),
    BodyMeasurement.find({ user_id: user._id }).sort({ measurement_date: -1 }).lean(),
  ]);

  const now = new Date();
  const membershipHistory = memberships.map((item) => ({
    ...item,
    effective_status: item.end_date && new Date(item.end_date) < now ? 'expired' : item.status,
  }));
  const successfulPayments = payments.filter((item) => item.status === 'success');
  const totalSuccessfulPayments = successfulPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return {
    user,
    admission,
    memberships: membershipHistory,
    payments,
    orders,
    measurements,
    summary: {
      totalMemberships: memberships.length,
      activeMemberships: membershipHistory.filter((item) => item.effective_status === 'active').length,
      expiredMemberships: membershipHistory.filter((item) => item.effective_status === 'expired').length,
      successfulPayments: successfulPayments.length,
      totalSuccessfulPayments,
      pendingPayments: payments.filter((item) => item.status === 'pending').length,
      failedPayments: payments.filter((item) => item.status === 'failed').length,
    },
  };
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
