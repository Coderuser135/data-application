import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ApiError } from './errors.utils.js';

function requiredSecret(name) {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`${name} must be configured with at least 32 characters`);
  }
  return value;
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateAccessToken(user, sessionId) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, sid: sessionId.toString(), type: 'access', jti: crypto.randomUUID() },
    requiredSecret('JWT_ACCESS_SECRET'),
    { expiresIn: '15m', issuer: 'gym-management-api', audience: 'gym-management-client' }
  );
}

export function generateRefreshToken(user, sessionId) {
  return jwt.sign(
    { id: user._id.toString(), sid: sessionId.toString(), type: 'refresh', jti: crypto.randomUUID() },
    requiredSecret('JWT_REFRESH_SECRET'),
    { expiresIn: '7d', issuer: 'gym-management-api', audience: 'gym-management-client' }
  );
}

export function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, requiredSecret('JWT_ACCESS_SECRET'), {
      issuer: 'gym-management-api', audience: 'gym-management-client', algorithms: ['HS256'],
    });
    if (payload.type !== 'access' || !payload.sid || !payload.id) throw new Error('Invalid access token');
    return payload;
  } catch {
    throw new ApiError(401, 'Authentication required');
  }
}

export function verifyRefreshToken(token) {
  try {
    const payload = jwt.verify(token, requiredSecret('JWT_REFRESH_SECRET'), {
      issuer: 'gym-management-api', audience: 'gym-management-client', algorithms: ['HS256'],
    });
    if (payload.type !== 'refresh' || !payload.sid || !payload.id) throw new Error('Invalid refresh token');
    return payload;
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
}
