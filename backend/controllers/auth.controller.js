import * as authService from '../services/auth.service.js';
import { verifyRefreshToken } from '../utils/jwt.utils.js';

function cookieOptions(maxAge) {
  const production = process.env.NODE_ENV === 'production';
  const sameSite = process.env.COOKIE_SAME_SITE || (production ? 'none' : 'lax');
  return {
    httpOnly: true,
    secure: production,
    sameSite,
    maxAge,
    path: '/',
  };
}

function requestMetadata(req) {
  return {
    userAgent: req.get('user-agent') || '',
    ipAddress: req.ip || req.socket?.remoteAddress || '',
  };
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
}

function clearAuthCookies(res) {
  const options = cookieOptions(0);
  res.clearCookie('accessToken', options);
  res.clearCookie('refreshToken', options);
}

export async function register(req, res, next) {
  try {
    const result = await authService.registerUser(req.body, requestMetadata(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(201).json({ user: result.user });
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body, requestMetadata(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.json({ user: result.user });
  } catch (err) { next(err); }
}

export async function refresh(req, res, next) {
  try {
    const result = await authService.refreshAccessToken(req.cookies?.refreshToken, requestMetadata(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.set('Cache-Control', 'no-store');
    res.json({ user: result.user });
  } catch (err) {
    clearAuthCookies(res);
    next(err);
  }
}

export async function logout(req, res) {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (rawToken) {
      const payload = verifyRefreshToken(rawToken);
      await authService.revokeSession(payload.sid, payload.id, 'logout');
    }
  } catch {
    // Invalid or expired cookies are still cleared during logout.
  }
  clearAuthCookies(res);
  res.set('Cache-Control', 'no-store');
  res.json({ message: 'Logged out successfully' });
}

export async function logoutAll(req, res, next) {
  try {
    await authService.revokeAllSessions(req.user._id, 'logout-all');
    clearAuthCookies(res);
    res.set('Cache-Control', 'no-store');
    res.json({ message: 'Logged out from all devices. Please log in again.' });
  } catch (err) { next(err); }
}

export async function me(req, res, next) {
  try { res.set('Cache-Control', 'no-store'); res.json(await authService.getMe(req.user._id)); } catch (err) { next(err); }
}

export async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword(req.user._id, req.body);
    clearAuthCookies(res);
    res.json(result);
  } catch (err) { next(err); }
}

export async function forgotPassword(req, res, next) {
  try { res.json(await authService.requestPasswordReset(req.body)); } catch (err) { next(err); }
}

export async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body);
    clearAuthCookies(res);
    res.json(result);
  } catch (err) { next(err); }
}
