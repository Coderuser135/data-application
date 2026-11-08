import * as authService from '../services/auth.service.js';
import { verifyRefreshToken } from '../utils/jwt.utils.js';

const cookieOptions = (maxAge) => {
  const production = process.env.NODE_ENV === 'production';
  const sameSite = process.env.COOKIE_SAME_SITE || (production ? 'none' : 'lax');
  return { httpOnly: true, secure: production, sameSite, maxAge, path: '/' };
};
const requestMetadata = (req) => {
  return { userAgent: req.get('user-agent') || '', ipAddress: req.ip || req.socket?.remoteAddress || '' };
};
const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
};
const clearAuthCookies = (res) => {
  const options = cookieOptions(0);
  res.clearCookie('accessToken', options);
  res.clearCookie('refreshToken', options);
};
export const register = async (req, res, next) => {
  try { res.set('Cache-Control', 'no-store'); res.status(201).json(await authService.registerUser(req.body)); }
  catch (err) { next(err); }
};
export const verifyEmail = async (req, res, next) => {
  try { res.set('Cache-Control', 'no-store'); res.json(await authService.verifyEmailOtp(req.body)); }
  catch (err) { next(err); }
};
export const resendVerificationOtp = async (req, res, next) => {
  try { res.set('Cache-Control', 'no-store'); res.json(await authService.resendEmailVerificationOtp(req.body)); }
  catch (err) { next(err); }
};
export const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body, requestMetadata(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.json({ user: result.user });
  } catch (err) { next(err); }
};
export const refresh = async (req, res, next) => {
  try {
    const result = await authService.refreshAccessToken(req.cookies?.refreshToken, requestMetadata(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.set('Cache-Control', 'no-store');
    res.json({ user: result.user });
  } catch (err) { clearAuthCookies(res); next(err); }
};
export const logout = async (req, res) => {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (rawToken) { const payload = verifyRefreshToken(rawToken); await authService.revokeSession(payload.sid, payload.id, 'logout'); }
  } catch { /* Clear invalid cookies as well. */ }
  clearAuthCookies(res); res.set('Cache-Control', 'no-store'); res.json({ message: 'Logged out successfully' });
};
export const logoutAll = async (req, res, next) => {
  try {
    await authService.revokeAllSessions(req.user._id, 'logout-all');
    clearAuthCookies(res); res.set('Cache-Control', 'no-store');
    res.json({ message: 'Logged out from all devices. Please log in again.' });
  } catch (err) { next(err); }
};
export const me = async (req, res, next) => {
  try { res.set('Cache-Control', 'no-store'); res.json(await authService.getMe(req.user._id)); } catch (err) { next(err); }
};
export const changePassword = async (req, res, next) => {
  try { const result = await authService.changePassword(req.user._id, req.body); clearAuthCookies(res); res.json(result); }
  catch (err) { next(err); }
};
export const forgotPassword = async (req, res, next) => {
  try { res.json(await authService.requestPasswordReset(req.body)); } catch (err) { next(err); }
};
export const verifyPasswordResetOtp = async (req, res, next) => {
  try { res.set('Cache-Control', 'no-store'); res.json(await authService.verifyPasswordResetOtp(req.body)); }
  catch (err) { next(err); }
};
export const resetPassword = async (req, res, next) => {
  try { const result = await authService.resetPassword(req.body); clearAuthCookies(res); res.json(result); }
  catch (err) { next(err); }
};