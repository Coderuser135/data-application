import mongoose from 'mongoose';
import Membership from '../models/membership.model.js';
import Notification from '../models/notification.model.js';

export async function activateScheduledMemberships() {
  const result = await Membership.updateMany(
    { status: 'scheduled', payment_status: 'paid', start_date: { $lte: new Date() }, end_date: { $gt: new Date() } },
    { $set: { status: 'active' } }
  );
  return { activated: result.modifiedCount || 0 };
}

export async function expireMemberships() {
  const result = await Membership.updateMany(
    { status: 'active', end_date: { $lt: new Date() } },
    { $set: { status: 'expired' } }
  );
  return { expired: result.modifiedCount || 0 };
}

export async function sendExpiryReminders() {
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const expiringSoon = await Membership.find({ status: 'active', end_date: { $gte: now, $lte: twoDaysFromNow } }).populate({ path: 'user_id', select: 'full_name' });
  let notified = 0;
  for (const membership of expiringSoon) {
    if (!membership.user_id) continue;
    const existing = await Notification.findOne({ user_id: membership.user_id._id, related_id: membership._id, related_type: 'membership_expiry' });
    if (existing) continue;
    await Notification.create({
      user_id: membership.user_id._id,
      title: 'Membership expiring soon',
      message: `Your ${membership.plan_name_snapshot} membership expires on ${new Date(membership.end_date).toLocaleDateString('en-IN')}. Renew now to keep training.`,
      type: 'membership_expiry',
      related_id: membership._id,
      related_type: 'membership_expiry',
    });
    notified += 1;
  }
  return { notified };
}

export async function runMembershipExpiry() {
  const activated = await activateScheduledMemberships();
  const expired = await expireMemberships();
  const reminders = await sendExpiryReminders();
  return { ...activated, ...expired, ...reminders };
}

export function startMembershipExpiryJob() {
  if (process.env.DISABLE_IN_PROCESS_JOBS === 'true') return null;
  const interval = setInterval(() => {
    if (mongoose.connection.readyState === 1) runMembershipExpiry().catch(() => {});
  }, 60 * 60 * 1000);
  return interval;
}
