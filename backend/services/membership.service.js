import mongoose from 'mongoose';
import Membership from '../models/membership.model.js';
import MembershipPlan from '../models/membershipPlan.model.js';
import Payment from '../models/payment.model.js';
import GymAdmission from '../models/gymAdmission.model.js';
import User from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import { ApiError } from '../utils/errors.utils.js';

function nextStartDate(membership) {
  const today = new Date();
  const end = membership?.end_date ? new Date(membership.end_date) : null;
  if ((membership?.status === 'active' || membership?.status === 'scheduled') && end && end >= today) {
    end.setDate(end.getDate() + 1);
    return end;
  }
  return today;
}

export async function getMembershipsByUserId(userId) {
  const memberships = await Membership.find({ user_id: userId }).sort({ createdAt: -1 }).lean();
  if (!memberships.length) return [];

  const membershipIds = memberships.map((membership) => membership._id);
  const admissionIds = memberships.map((membership) => membership.gym_admission_id).filter(Boolean);
  const payments = await Payment.find({
    user_id: userId,
    $or: [
      { membership_id: { $in: membershipIds } },
      ...(admissionIds.length ? [{ gym_admission_id: { $in: admissionIds }, payment_type: 'membership_advance' }] : []),
    ],
  }).select('membership_id gym_admission_id amount allocated_amount payment_type status').lean();

  const now = new Date();
  return memberships.map((membership) => {
    const related = payments.filter((payment) =>
      String(payment.membership_id || '') === String(membership._id)
      || (payment.payment_type === 'membership_advance'
        && String(payment.gym_admission_id || '') === String(membership.gym_admission_id || ''))
    );
    const allocatedAdvance = related
      .filter((payment) => payment.payment_type === 'membership_advance'
        && String(payment.membership_id || '') === String(membership._id)
        && payment.status === 'success')
      .reduce((sum, payment) => sum + Number(payment.allocated_amount || 0), 0);
    // The membership stores its advance allocation at creation. Only use
    // advances explicitly allocated to this membership as a ledger fallback.
    const advancePaid = membership.membership_type === 'renewal' ? 0 : Math.max(
      Number(membership.advance_paid || 0),
      allocatedAdvance,
    );
    const received = related
      .filter((payment) => ['membership_full', 'membership_installment'].includes(payment.payment_type)
        && payment.status === 'success')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const amountDue = Math.max(0, Number((
      Number(membership.plan_price_snapshot || 0) - advancePaid - received
    ).toFixed(2)));
    const paymentStatus = related.some((payment) => payment.status === 'refunded')
      ? 'refunded'
      : amountDue === 0 ? 'paid' : 'pending';

    return {
      ...membership,
      id: String(membership._id),
      advance_paid: advancePaid,
      amount_due: amountDue,
      payment_status: paymentStatus,
      effective_status: membership.end_date && new Date(membership.end_date) < now
        && ['active', 'scheduled'].includes(membership.status) ? 'expired' : membership.status,
    };
  });
}
export async function getAllMemberships({
  search = '',
  status = 'all',
  paymentStatus = 'all',
  expiry = 'all',
  plan = 'all',
  membershipType = 'all',
  page = 1,
  limit = 10,
} = {}) {
  const now = new Date();
  const customerIds = await User.distinct('_id', { role: 'user' });
  const filter = { user_id: { $in: customerIds } };
  if (status !== 'all') {
    if (status === 'expired') {
      filter.$or = [{ status: 'expired' }, { end_date: { $lt: now }, status: { $in: ['active', 'scheduled'] } }];
    } else if (status === 'active') {
      filter.status = 'active';
      filter.$and = [{ $or: [{ end_date: null }, { end_date: { $gte: now } }] }];
    } else {
      filter.status = status;
    }
  }

  if (paymentStatus !== 'all') filter.payment_status = paymentStatus;
  if (plan !== 'all') filter.plan_id = plan;
  if (membershipType !== 'all') filter.membership_type = membershipType;

  if (expiry === 'expired') {
    filter.end_date = { $lt: now };
  } else if (expiry === 'today') {
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    filter.end_date = { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()), $lte: end };
  } else if (expiry === '7' || expiry === '30') {
    const end = new Date(now); end.setDate(end.getDate() + Number(expiry));
    filter.end_date = { $gte: now, $lte: end };
  }

  if (search.trim()) {
    const users = await User.find({
      role: 'user',
      $or: [
        { full_name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } },
      ],
    }).select('_id').lean();
    filter.user_id = { $in: users.map((user) => user._id) };
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
  const [rows, total, plans, counts] = await Promise.all([
    Membership.find(filter)
      .populate({ path: 'user_id', select: 'full_name email phone role avatar_url' })
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Membership.countDocuments(filter),
    MembershipPlan.find().select('_id name').sort({ display_order: 1 }).lean(),
    Promise.all([
      Membership.countDocuments({ user_id: { $in: customerIds }, status: 'active', $or: [{ end_date: null }, { end_date: { $gte: now } }] }),
      Membership.countDocuments({ user_id: { $in: customerIds }, status: 'pending' }),
      Membership.countDocuments({ user_id: { $in: customerIds }, $or: [{ status: 'expired' }, { end_date: { $lt: now }, status: { $in: ['active', 'scheduled'] } }] }),
      Membership.countDocuments({ user_id: { $in: customerIds }, end_date: { $gte: now, $lte: new Date(now.getTime() + 7 * 86400000) }, status: { $in: ['active', 'scheduled'] } }),
      Membership.countDocuments({ user_id: { $in: customerIds } }),
    ]),
  ]);

  const visibleRows = rows.filter((item) => item.user_id?.role === 'user');
  const membershipIds = visibleRows.map((item) => item._id);
  const admissionIds = visibleRows.map((item) => item.gym_admission_id).filter(Boolean);
  const ledgerPayments = membershipIds.length
    ? await Payment.find({
      $or: [
        { membership_id: { $in: membershipIds } },
        ...(admissionIds.length
          ? [{ gym_admission_id: { $in: admissionIds }, payment_type: 'membership_advance' }]
          : []),
      ],
    }).select('membership_id gym_admission_id amount allocated_amount payment_type status').lean()
    : [];

  const safeRows = visibleRows.map((item) => {
    const relatedPayments = ledgerPayments.filter((payment) =>
      String(payment.membership_id || '') === String(item._id)
      || (payment.payment_type === 'membership_advance'
        && String(payment.gym_admission_id || '') === String(item.gym_admission_id || ''))
    );
    const allocatedAdvance = relatedPayments
      .filter((payment) => payment.payment_type === 'membership_advance'
        && String(payment.membership_id || '') === String(item._id))
      .reduce((sum, payment) => sum + Number(payment.allocated_amount || 0), 0);
    const advancePaid = item.membership_type === 'renewal' ? 0 : Math.max(
      Number(item.advance_paid || 0),
      allocatedAdvance,
    );
    const membershipPayments = relatedPayments.filter((payment) =>
      payment.payment_type !== 'membership_advance' && payment.status === 'success'
    );
    const amountReceived = membershipPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const amountDue = Math.max(0, Number((
      Number(item.plan_price_snapshot || 0) - advancePaid - amountReceived
    ).toFixed(2)));
    const paymentStatus = relatedPayments.some((payment) => payment.status === 'refunded')
      ? 'refunded'
      : amountDue === 0 ? 'paid' : 'pending';

    return {
      ...item,
      advance_paid: advancePaid,
      amount_due: amountDue,
      payment_status: paymentStatus,
      effective_status: (item.end_date && new Date(item.end_date) < now && ['active', 'scheduled'].includes(item.status))
        ? 'expired'
        : item.status,
    };
  });

  return {
    rows: safeRows,
    total,
    page: safePage,
    pages: Math.max(1, Math.ceil(total / safeLimit)),
    limit: safeLimit,
    plans,
    stats: { active: counts[0], pending: counts[1], expired: counts[2], expiringSoon: counts[3], total: counts[4] },
  };
}

export async function getMembershipDetails(membershipId) {
  if (!mongoose.isValidObjectId(membershipId)) throw new ApiError(400, 'Invalid membership ID');
  const membership = await Membership.findById(membershipId)
    .populate({ path: 'user_id', select: 'full_name email phone role createdAt avatar_url' })
    .populate({ path: 'gym_admission_id', select: 'member_id admission_date status' })
    .lean();
  if (!membership || membership.user_id?.role !== 'user') throw new ApiError(404, 'Membership not found');
  const paymentFilter = {
    user_id: membership.user_id._id,
    $or: [
      { membership_id: membership._id },
      ...(membership.membership_type !== 'renewal' && membership.gym_admission_id
        ? [{ gym_admission_id: membership.gym_admission_id, payment_type: 'membership_advance' }]
        : []),
    ],
  };
  const payments = await Payment.find(paymentFilter)
    .select('-razorpay_signature')
    .sort({ payment_date: -1, createdAt: -1 })
    .lean();

  // Keep the membership balance tied to real successful payment records.
  // Admission advances are shown in the history but counted only up to the
  // amount reserved for this membership, preventing double counting.
  const allocatedAdvance = payments
    .filter((payment) => payment.payment_type === 'membership_advance'
      && (String(payment.membership_id || '') === String(membership._id)))
    .reduce((sum, payment) => sum + Number(payment.allocated_amount || 0), 0);
  const advancePaid = membership.membership_type === 'renewal' ? 0 : Math.max(
    Number(membership.advance_paid || 0),
    allocatedAdvance,
  );
  const membershipPayments = payments.filter((payment) =>
    payment.payment_type !== 'membership_advance' && payment.status === 'success'
  );
  const amountReceived = membershipPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const calculatedDue = Math.max(0, Number((
    Number(membership.plan_price_snapshot || 0) - advancePaid - amountReceived
  ).toFixed(2)));
  const hasRefund = payments.some((payment) => payment.status === 'refunded');
  const calculatedPaymentStatus = hasRefund
    ? 'refunded'
    : calculatedDue === 0 ? 'paid' : 'pending';

  return {
    ...membership,
    advance_paid: advancePaid,
    amount_due: calculatedDue,
    payment_status: calculatedPaymentStatus,
    effective_status: membership.status === 'frozen' ? 'frozen' : (membership.end_date && new Date(membership.end_date) < new Date()
      && ['active', 'scheduled'].includes(membership.status) ? 'expired' : membership.status),
    payments,
  };
}
export async function getActivePlans(userId) {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const plans = await MembershipPlan.find({
    is_active: true,
    $and: [
      { $or: [{ is_offer: { $ne: true } }, { offer_start_date: null }, { offer_start_date: { $lte: now } }] },
      { $or: [{ is_offer: { $ne: true } }, { offer_end_date: null }, { offer_end_date: { $gte: endOfToday } }] },
    ],
  }).sort({ display_order: 1 }).lean();
  const admission = await GymAdmission.findOne({ user_id: userId, status: 'active' }).select('_id').lean();

  if (!admission) {
    return plans.map((plan) => ({ ...plan, id: plan._id.toString(), advance_credit: 0, payable_price: plan.price }));
  }

  // Admission advance is visible only until the user's first membership has been paid.
  const hasPurchasedMembership = await Membership.exists({
    user_id: userId,
    gym_admission_id: admission._id,
    payment_status: 'paid',
  });
  if (hasPurchasedMembership) {
    return plans.map((plan) => ({ ...plan, id: plan._id.toString(), advance_credit: 0, payable_price: plan.price }));
  }

  const advances = await Payment.find({
    user_id: userId,
    $or: [{ gym_admission_id: admission._id }, { gym_admission_id: null }],
    payment_type: 'membership_advance',
    status: 'success',
  }).select('amount allocated_amount').lean();

  const advanceCredit = advances.reduce((total, payment) => (
    total + Math.max(0, Number(payment.amount || 0) - Number(payment.allocated_amount || 0))
  ), 0);

  return plans.map((plan) => ({
    ...plan,
    id: plan._id.toString(),
    advance_credit: advanceCredit,
    payable_price: Math.max(0, Number((plan.price - advanceCredit).toFixed(2))),
  }));
}

export async function getAdvancePaid(userId, membershipId) {
  const payments = await Payment.find({
    user_id: userId,
    membership_id: membershipId,
    payment_type: 'membership_advance',
    status: 'success',
  });
  return payments.reduce((sum, payment) => sum + Number(payment.allocated_amount || 0), 0);
}

async function ensureNoPendingMembership(userId, session) {
  const pending = await Membership.findOne({ user_id: userId, status: 'pending' }).session(session);
  if (pending) throw new ApiError(409, 'You already have a pending membership payment. Complete it before creating another.');
}

async function getAvailableAdvance(userId, admissionId, session) {
  const advances = await Payment.find({
    user_id: userId,
    $or: [{ gym_admission_id: admissionId }, { gym_admission_id: null }],
    payment_type: 'membership_advance',
    status: 'success',
    $expr: { $lt: [{ $ifNull: ['$allocated_amount', 0] }, '$amount'] },
  }).sort({ payment_date: 1, createdAt: 1 }).session(session);

  return advances.reduce((total, advance) => (
    total + Math.max(0, Number(advance.amount || 0) - Number(advance.allocated_amount || 0))
  ), 0);
}

// Called only when the first membership is fully paid (or its balance is zero).
// Merely creating a pending membership must not consume the user's admission advance.
export async function allocateMembershipAdvance(userId, membership, session) {
  let remaining = Number(membership.advance_paid || 0);
  if (remaining <= 0) return;

  const advances = await Payment.find({
    user_id: userId,
    $or: [{ gym_admission_id: membership.gym_admission_id }, { gym_admission_id: null }],
    payment_type: 'membership_advance',
    status: 'success',
    $expr: { $lt: [{ $ifNull: ['$allocated_amount', 0] }, '$amount'] },
  }).sort({ payment_date: 1, createdAt: 1 }).session(session);

  for (const advance of advances) {
    if (remaining <= 0) break;
    const available = Math.max(0, Number(advance.amount || 0) - Number(advance.allocated_amount || 0));
    const applied = Math.min(available, remaining);
    if (applied <= 0) continue;

    advance.allocated_amount = Number(advance.allocated_amount || 0) + applied;
    advance.membership_id = membership._id;
    advance.gym_admission_id = membership.gym_admission_id;
    await advance.save({ session });
    remaining -= applied;
  }

  if (remaining > 0) {
    throw new ApiError(409, 'Admission advance credit is no longer available. Please refresh and try again.');
  }
}

async function createMembershipWithAdvance({ userId, admission, plan, startDate, useAdmissionAdvance = false, membershipType = 'initial', parentMembershipId = null }) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      await ensureNoPendingMembership(userId, session);
      const membership = new Membership({
        user_id: userId,
        gym_admission_id: admission._id,
        plan_id: plan._id,
        plan_name_snapshot: plan.name,
        plan_price_snapshot: plan.price,
        membership_type: membershipType,
        parent_membership_id: parentMembershipId,
        duration_days: plan.duration_days,
        start_date: startDate,
        status: 'pending',
        payment_status: 'pending',
        advance_paid: 0,
        amount_due: plan.price,
      });
      if (useAdmissionAdvance) {
        const availableCredit = await getAvailableAdvance(userId, admission._id, session);
        membership.advance_paid = Math.min(Number(plan.price), availableCredit);
        membership.amount_due = Math.max(0, Number((plan.price - membership.advance_paid).toFixed(2)));
      }

      if (membership.amount_due === 0) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + membership.duration_days);
        membership.end_date = endDate;
        membership.payment_status = 'paid';
        membership.status = startDate > new Date() ? 'scheduled' : 'active';
      }
      await membership.save({ session });

      if (membership.payment_status === 'paid') {
        await allocateMembershipAdvance(userId, membership, session);
        await new Notification({
          user_id: userId,
          title: 'Membership Activated',
          message: `Your ${membership.plan_name_snapshot} membership is now active. Your advance credit covered the full plan price.`,
          type: 'membership',
          related_id: membership._id,
          related_type: 'Membership',
        }).save({ session });
      }
      result = membership;
    });
    return result;
  } finally {
    await session.endSession();
  }
}

export async function purchaseMembership(userId, planId) {
  const plan = await MembershipPlan.findOne({ _id: planId, is_active: true });
  if (!plan) throw new ApiError(404, 'Plan not found');
  const admission = await GymAdmission.findOne({ user_id: userId, status: 'active' });
  if (!admission) throw new ApiError(400, 'No active gym admission found. Ask gym staff to admit you first.');
  const active = await Membership.findOne({ user_id: userId, status: { $in: ['active', 'scheduled'] } });
  if (active) throw new ApiError(409, 'You already have an active or scheduled membership. Use renewal instead.');
  return createMembershipWithAdvance({ userId, admission, plan, startDate: new Date(), useAdmissionAdvance: true });
}

export async function payAdvance() {
  throw new ApiError(400, 'Additional membership payments are made against the remaining balance using the membership payment flow.');
}

export async function renewMembership(userId, membershipId) {
  const oldMembership = await Membership.findOne({ _id: membershipId, user_id: userId });
  if (!oldMembership) throw new ApiError(404, 'Membership not found');
  const plan = await MembershipPlan.findOne({ _id: oldMembership.plan_id, is_active: true });
  if (!plan) throw new ApiError(404, 'Original plan not found');
  const admission = await GymAdmission.findOne({ user_id: userId, status: 'active' });
  if (!admission) throw new ApiError(400, 'An active gym admission is required to renew membership.');
  if (oldMembership.status === 'active' || oldMembership.status === 'scheduled') {
    const otherActive = await Membership.findOne({
      user_id: userId,
      status: { $in: ['active', 'scheduled'] },
      _id: { $ne: oldMembership._id },
    });
    if (otherActive) throw new ApiError(409, 'Another active or scheduled membership already exists');
  }
  return createMembershipWithAdvance({
    userId,
    admission,
    plan,
    startDate: nextStartDate(oldMembership),
    useAdmissionAdvance: false,
    membershipType: 'renewal',
    parentMembershipId: oldMembership._id,
  });
}

