import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Session from '../models/session.model.js';
import EmailOtp from '../models/emailOtp.model.js';
import PasswordResetToken from '../models/passwordResetToken.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashToken } from '../utils/jwt.utils.js';
import { ApiError } from '../utils/errors.utils.js';
import { sendEmailVerificationOtp, sendPasswordResetEmail } from '../utils/email.utils.js';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_DURATION_MS = 5 * 60 * 1000;
const OTP_RESEND_WAIT_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('not-a-real-user-password', 12);

function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new ApiError(400, 'Password must be at least 12 characters and no more than 72 UTF-8 bytes');
  }
}
function sessionMetadata(metadata = {}) {
  return { user_agent: String(metadata.userAgent || '').slice(0, 500), ip_address: String(metadata.ipAddress || '').slice(0, 64) };
}
function otpHash(otp) {
  const secret = process.env.OTP_SECRET || process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('OTP_SECRET must be configured');
  return crypto.createHmac('sha256', secret).update(String(otp)).digest('hex');
}
async function issueEmailVerificationOtp(user) {
  const now = new Date();
  const current = await EmailOtp.findOne({ user_id: user._id, purpose: 'verify_email', consumed_at: null }).sort({ createdAt: -1 });
  if (current && now.getTime() - current.last_sent_at.getTime() < OTP_RESEND_WAIT_MS) {
    throw new ApiError(429, 'Please wait 60 seconds before requesting another code');
  }
  await EmailOtp.deleteMany({ user_id: user._id, purpose: 'verify_email' });
  const otp = String(crypto.randomInt(100000, 1000000));
  await EmailOtp.create({
    user_id: user._id,
    email: user.email,
    purpose: 'verify_email',
    otp_hash: otpHash(otp),
    expires_at: new Date(now.getTime() + OTP_DURATION_MS),
    last_sent_at: now,
  });
  try {
    await sendEmailVerificationOtp({ to: user.email, otp, fullName: user.full_name });
  } catch (error) {
    console.error('[email] Verification email failed:', {
      code: error?.code,
      message: error?.message,
      responseCode: error?.responseCode,
      command: error?.command,
    });
    await EmailOtp.deleteMany({ user_id: user._id, purpose: 'verify_email' });
    throw new ApiError(503, 'Verification email could not be sent. Check the server email configuration and logs.');
  }
}
async function createSession(user, metadata) {
  const familyId = crypto.randomUUID();
  const sessionObjectId = new mongoose.Types.ObjectId();
  const refreshToken = generateRefreshToken(user, sessionObjectId);
  const session = await Session.create({
    _id: sessionObjectId, user_id: user._id, family_id: familyId,
    refresh_token_hash: hashToken(refreshToken),
    expires_at: new Date(Date.now() + SESSION_DURATION_MS),
    ...sessionMetadata(metadata),
  });
  return { user, session, accessToken: generateAccessToken(user, session._id), refreshToken };
}

export async function registerUser({ email, password, full_name, fullName, phone }) {
  const normalizedEmail = normalizeEmail(email);
  validatePassword(password);
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new ApiError(400, 'A valid email is required');

  let user;
  try {
    user = await User.create({
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      full_name: String(full_name ?? fullName ?? '').trim().slice(0, 100),
      phone: String(phone || '').trim().slice(0, 30),
      email_verified: false,
    });
  } catch (error) {
    if (error?.code === 11000) throw new ApiError(409, 'Email already registered. If you have not verified it, use resend verification code.');
    throw error;
  }

  await issueEmailVerificationOtp(user);
  return { message: 'Verification code sent. Verify your email, then log in.', email: user.email, requiresEmailVerification: true };
}

export async function resendEmailVerificationOtp({ email }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || user.email_verified) {
    return { message: 'If this account needs verification, a new code will be sent.' };
  }
  await issueEmailVerificationOtp(user);
  return { message: 'If this account needs verification, a new code will be sent.' };
}

export async function verifyEmailOtp({ email, otp }) {
  const normalizedEmail = normalizeEmail(email);
  if (!/^\d{6}$/.test(String(otp || ''))) throw new ApiError(400, 'Enter the 6-digit verification code');
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new ApiError(400, 'Invalid or expired verification code');
  if (user.email_verified) return { message: 'Email is already verified. Please log in.' };

  const record = await EmailOtp.findOne({
    user_id: user._id, purpose: 'verify_email', consumed_at: null, expires_at: { $gt: new Date() },
  }).sort({ createdAt: -1 });
  if (!record) throw new ApiError(400, 'Verification code expired. Request a new code.');

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await EmailOtp.deleteOne({ _id: record._id });
    throw new ApiError(429, 'Too many incorrect attempts. Request a new code.');
  }
  if (record.otp_hash !== otpHash(otp)) {
    await EmailOtp.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    throw new ApiError(400, 'Incorrect verification code');
  }

  const consumed = await EmailOtp.updateOne(
    { _id: record._id, consumed_at: null, expires_at: { $gt: new Date() }, otp_hash: otpHash(otp) },
    { $set: { consumed_at: new Date() } }
  );
  if (consumed.modifiedCount !== 1) throw new ApiError(400, 'Verification code is invalid or already used');

  user.email_verified = true;
  user.email_verified_at = new Date();
  await user.save();
  await EmailOtp.deleteMany({ user_id: user._id, purpose: 'verify_email' });
  return { message: 'Email verified successfully. Please log in.' };
}

export async function loginUser({ email, password }, metadata) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || typeof password !== 'string') throw new ApiError(401, 'Invalid credentials');
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  const passwordMatches = await bcrypt.compare(password, user?.password || DUMMY_PASSWORD_HASH);
  if (!user || !passwordMatches) throw new ApiError(401, 'Invalid credentials');
  if (!user.email_verified) throw new ApiError(403, 'Please verify your email before logging in');
  return createSession(user, metadata);
}

export async function refreshAccessToken(rawRefreshToken, metadata) {
  if (!rawRefreshToken) throw new ApiError(401, 'Invalid or expired refresh token');
  const payload = verifyRefreshToken(rawRefreshToken);
  const session = await Session.findById(payload.sid);
  if (!session || session.user_id.toString() !== payload.id || session.revoked_at || session.expires_at <= new Date()) {
    throw new ApiError(401, 'Session expired. Please log in again');
  }
  const presentedHash = hashToken(rawRefreshToken);
  if (session.refresh_token_hash !== presentedHash) {
    if (session.used_refresh_token_hashes.includes(presentedHash)) {
      await Session.updateOne({ _id: session._id, revoked_at: null }, { $set: { revoked_at: new Date(), revoke_reason: 'refresh-token-reuse-detected' } });
    }
    throw new ApiError(401, 'Invalid or reused refresh token. Please log in again');
  }
  const user = await User.findById(payload.id);
  if (!user || !user.email_verified) {
    await Session.updateOne({ _id: session._id, revoked_at: null }, { $set: { revoked_at: new Date(), revoke_reason: 'user-not-verified-or-not-found' } });
    throw new ApiError(401, 'Authentication required');
  }
  const nextRefreshToken = generateRefreshToken(user, session._id);
  const nextHash = hashToken(nextRefreshToken);
  const rotation = await Session.updateOne(
    { _id: session._id, refresh_token_hash: presentedHash, revoked_at: null, expires_at: { $gt: new Date() } },
    { $set: { refresh_token_hash: nextHash, last_used_at: new Date(), ...sessionMetadata(metadata) }, $addToSet: { used_refresh_token_hashes: presentedHash } }
  );
  if (rotation.modifiedCount !== 1) {
    await Session.updateOne({ _id: session._id, used_refresh_token_hashes: presentedHash, revoked_at: null }, { $set: { revoked_at: new Date(), revoke_reason: 'refresh-token-reuse-detected' } });
    throw new ApiError(401, 'Session changed. Please log in again');
  }
  return { user, accessToken: generateAccessToken(user, session._id), refreshToken: nextRefreshToken };
}

export async function revokeSession(sessionId, userId, reason = 'logout') {
  if (!sessionId) return;
  await Session.updateOne({ _id: sessionId, user_id: userId, revoked_at: null }, { $set: { revoked_at: new Date(), revoke_reason: reason } });
}
export async function revokeAllSessions(userId, reason = 'logout-all') {
  await Session.updateMany({ user_id: userId, revoked_at: null }, { $set: { revoked_at: new Date(), revoke_reason: reason } });
}
export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  if (!user.email_verified) throw new ApiError(403, 'Email verification required');
  return user;
}
export async function changePassword(userId, { currentPassword, newPassword }) {
  validatePassword(newPassword);
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'User not found');
  if (!(await bcrypt.compare(currentPassword || '', user.password))) throw new ApiError(401, 'Current password is incorrect');
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  await revokeAllSessions(userId, 'password-changed');
  return { message: 'Password changed successfully. Please log in again on all devices.' };
}
export async function requestPasswordReset({ email }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return { message: 'If that email is registered, a password reset link will be sent.' };
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  await PasswordResetToken.deleteMany({ user_id: user._id, used_at: null });
  await PasswordResetToken.create({ user_id: user._id, token_hash: tokenHash, expires_at: new Date(Date.now() + 60 * 60 * 1000) });
  try {
    await sendPasswordResetEmail({ to: user.email, token: rawToken });
  } catch (error) {
    console.error('[email] Password reset email failed:', {
      code: error?.code,
      message: error?.message,
      responseCode: error?.responseCode,
      command: error?.command,
    });
    await PasswordResetToken.deleteOne({ token_hash: tokenHash });
    throw new ApiError(503, 'Password reset email service is temporarily unavailable');
  }
  return { message: 'If that email is registered, a password reset link will be sent.' };
}
export async function resetPassword({ token, newPassword }) {
  validatePassword(newPassword);
  if (typeof token !== 'string' || token.length < 32 || token.length > 256) throw new ApiError(400, 'Invalid or expired reset token');
  const tokenHash = hashToken(token);
  const resetToken = await PasswordResetToken.findOneAndUpdate(
    { token_hash: tokenHash, used_at: null, expires_at: { $gt: new Date() } },
    { $set: { used_at: new Date() } }, { new: true }
  );
  if (!resetToken) throw new ApiError(400, 'Invalid or expired reset token');
  const user = await User.findById(resetToken.user_id).select('+password');
  if (!user) throw new ApiError(400, 'Invalid or expired reset token');
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  await revokeAllSessions(user._id, 'password-reset');
  await PasswordResetToken.deleteMany({ user_id: user._id, _id: { $ne: resetToken._id } });
  return { message: 'Password reset successfully. Please log in again.' };
}
