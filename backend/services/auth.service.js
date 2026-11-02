import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Session from '../models/session.model.js';
import PasswordResetToken from '../models/passwordResetToken.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashToken } from '../utils/jwt.utils.js';
import { ApiError } from '../utils/errors.utils.js';
import { sendPasswordResetEmail } from '../utils/email.utils.js';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('not-a-real-user-password', 12);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new ApiError(400, 'Password must be at least 12 characters and no more than 72 UTF-8 bytes');
  }
}

function sessionMetadata(metadata = {}) {
  return {
    user_agent: String(metadata.userAgent || '').slice(0, 500),
    ip_address: String(metadata.ipAddress || '').slice(0, 64),
  };
}

async function createSession(user, metadata) {
  const familyId = crypto.randomUUID();
  const sessionObjectId = new mongoose.Types.ObjectId();
  const refreshToken = generateRefreshToken(user, sessionObjectId);
  const session = await Session.create({
    _id: sessionObjectId,
    user_id: user._id,
    family_id: familyId,
    refresh_token_hash: hashToken(refreshToken),
    expires_at: new Date(Date.now() + SESSION_DURATION_MS),
    ...sessionMetadata(metadata),
  });
  return {
    user,
    session,
    accessToken: generateAccessToken(user, session._id),
    refreshToken,
  };
}

export async function registerUser({ email, password, full_name, fullName, phone }, metadata) {
  const normalizedEmail = normalizeEmail(email);
  validatePassword(password);
  if (!normalizedEmail || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(normalizedEmail)) {
    throw new ApiError(400, 'A valid email is required');
  }
  const existing = await User.findOne({ email: normalizedEmail }).select('_id');
  if (existing) throw new ApiError(409, 'Email already registered');

  const user = await User.create({
    email: normalizedEmail,
    password: await bcrypt.hash(password, 12),
    full_name: String(full_name ?? fullName ?? '').trim().slice(0, 100),
    phone: String(phone || '').trim().slice(0, 30),
  });
  return createSession(user, metadata);
}

export async function loginUser({ email, password }, metadata) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || typeof password !== 'string') throw new ApiError(401, 'Invalid credentials');

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  const passwordMatches = await bcrypt.compare(password, user?.password || DUMMY_PASSWORD_HASH);
  if (!user || !passwordMatches) throw new ApiError(401, 'Invalid credentials');

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
      await Session.updateOne(
        { _id: session._id, revoked_at: null },
        { $set: { revoked_at: new Date(), revoke_reason: 'refresh-token-reuse-detected' } }
      );
    }
    throw new ApiError(401, 'Invalid or reused refresh token. Please log in again');
  }

  const user = await User.findById(payload.id);
  if (!user) {
    await Session.updateOne({ _id: session._id, revoked_at: null }, { $set: { revoked_at: new Date(), revoke_reason: 'user-not-found' } });
    throw new ApiError(401, 'Authentication required');
  }

  const nextRefreshToken = generateRefreshToken(user, session._id);
  const nextHash = hashToken(nextRefreshToken);
  const rotation = await Session.updateOne(
    { _id: session._id, refresh_token_hash: presentedHash, revoked_at: null, expires_at: { $gt: new Date() } },
    {
      $set: { refresh_token_hash: nextHash, last_used_at: new Date(), ...sessionMetadata(metadata) },
      $addToSet: { used_refresh_token_hashes: presentedHash },
    }
  );

  if (rotation.modifiedCount !== 1) {
    await Session.updateOne(
      { _id: session._id, used_refresh_token_hashes: presentedHash, revoked_at: null },
      { $set: { revoked_at: new Date(), revoke_reason: 'refresh-token-reuse-detected' } }
    );
    throw new ApiError(401, 'Session changed. Please log in again');
  }

  return { user, accessToken: generateAccessToken(user, session._id), refreshToken: nextRefreshToken };
}

export async function revokeSession(sessionId, userId, reason = 'logout') {
  if (!sessionId) return;
  await Session.updateOne(
    { _id: sessionId, user_id: userId, revoked_at: null },
    { $set: { revoked_at: new Date(), revoke_reason: reason } }
  );
}

export async function revokeAllSessions(userId, reason = 'logout-all') {
  await Session.updateMany(
    { user_id: userId, revoked_at: null },
    { $set: { revoked_at: new Date(), revoke_reason: reason } }
  );
}

export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
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
  } catch {
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
    { $set: { used_at: new Date() } },
    { new: true }
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
