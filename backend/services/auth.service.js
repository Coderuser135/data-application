import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/user.model.js';
import PasswordResetToken from '../models/passwordResetToken.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils.js';
import { ApiError } from '../utils/errors.utils.js';
import { sendPasswordResetEmail } from '../utils/email.utils.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters');
}

export async function registerUser({ email, password, full_name, fullName, phone }) {
  const normalizedEmail = normalizeEmail(email);
  validatePassword(password);
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new ApiError(400, 'A valid email is required');
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new ApiError(409, 'Email already registered');
  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({
    email: normalizedEmail,
    password: hashed,
    full_name: String(full_name ?? fullName ?? '').trim(),
    phone: String(phone || '').trim(),
  });
  return { user, accessToken: generateAccessToken(user), refreshToken: generateRefreshToken(user) };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || typeof password !== 'string') throw new ApiError(401, 'Invalid credentials');
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !(await bcrypt.compare(password, user.password))) throw new ApiError(401, 'Invalid credentials');
  return { user, accessToken: generateAccessToken(user), refreshToken: generateRefreshToken(user) };
}

export async function refreshAccessToken(refreshToken) {
  if (!refreshToken) throw new ApiError(401, 'Invalid refresh token');
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user) throw new Error('User not found');
    return { user, accessToken: generateAccessToken(user), refreshToken: generateRefreshToken(user) };
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }
}

export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  validatePassword(newPassword);
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  if (!(await bcrypt.compare(currentPassword || '', user.password))) throw new ApiError(401, 'Current password is incorrect');
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  return { message: 'Password changed successfully' };
}

export async function requestPasswordReset({ email }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return { message: 'If that email is registered, a password reset link will be sent.' };

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await PasswordResetToken.deleteMany({ user_id: user._id, used_at: null });
  await PasswordResetToken.create({ user_id: user._id, token_hash: tokenHash, expires_at: new Date(Date.now() + 60 * 60 * 1000) });

  try {
    await sendPasswordResetEmail({ to: user.email, token: rawToken });
  } catch (error) {
    await PasswordResetToken.deleteOne({ token_hash: tokenHash });
    throw new ApiError(503, 'Password reset email service is temporarily unavailable');
  }

  return { message: 'If that email is registered, a password reset link will be sent.' };
}

export async function resetPassword({ token, newPassword }) {
  validatePassword(newPassword);
  if (!token) throw new ApiError(400, 'Reset token is required');
  const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
  const resetToken = await PasswordResetToken.findOne({ token_hash: tokenHash, used_at: null, expires_at: { $gt: new Date() } });
  if (!resetToken) throw new ApiError(400, 'Invalid or expired reset token');
  const user = await User.findById(resetToken.user_id);
  if (!user) throw new ApiError(400, 'Invalid or expired reset token');
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  resetToken.used_at = new Date();
  await resetToken.save();
  return { message: 'Password reset successfully' };
}
