import mongoose from 'mongoose';
import Membership from '../models/membership.model.js';
import Notification from '../models/notification.model.js';

export async function expireMemberships() {
  await Membership.updateMany(
    { status: 'active', end_date: { $lt: new Date() } },
    { $set: { status: 'expired' } }
  );
}

export async function sendExpiryReminders() {
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  const expiringSoon = await Membership.find({
    status: 'active',
    end_date: { $gte: start, $lte: twoDaysFromNow },
  }).populate({ path: 'user_id', select: 'full_name' });

  for (const membership of expiringSoon) {
    if (!membership.user_id) continue;
    const existing = await Notification.findOne({
      user_id: membership.user_id._id,
      related_id: membership._id,
      related_type: 'membership_expiry',
    });
    if (existing) continue;
    await Notification.create({
      user_id: membership.user_id._id,
      title: 'Membership expiring soon',
      message: `Your ${membership.plan_name_snapshot} membership expires on ${new Date(membership.end_date).toLocaleDateString()}. Renew now to keep training.`,
      type: 'membership_expiry',
      related_id: membership._id,
      related_type: 'membership_expiry',
    });
  }
}

export function startMembershipExpiryJob() {
  const interval = setInterval(() => {
    if (mongoose.connection.readyState === 1) {
      expireMemberships().catch((err) => console.error('Membership expiry job failed', err));
      sendExpiryReminders().catch((err) => console.error('Expiry reminder job failed', err));
    }
  }, 60 * 60 * 1000);
  return interval;
}
