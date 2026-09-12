import * as authService from '../services/auth.service.js';

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

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
}

export async function register(req, res, next) {
  try { const result = await authService.registerUser(req.body); setAuthCookies(res, result.accessToken, result.refreshToken); res.status(201).json({ user: result.user }); } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try { const result = await authService.loginUser(req.body); setAuthCookies(res, result.accessToken, result.refreshToken); res.json({ user: result.user }); } catch (err) { next(err); }
}

export async function refresh(req, res, next) {
  try { const result = await authService.refreshAccessToken(req.cookies?.refreshToken); setAuthCookies(res, result.accessToken, result.refreshToken); res.json({ user: result.user }); } catch (err) { next(err); }
}

export function logout(req, res) {
  const options = cookieOptions(0);
  res.clearCookie('accessToken', options);
  res.clearCookie('refreshToken', options);
  res.json({ message: 'Logged out successfully' });
}

export async function me(req, res, next) {
  try { res.json(await authService.getMe(req.user._id)); } catch (err) { next(err); }
}

export async function changePassword(req, res, next) {
  try { res.json(await authService.changePassword(req.user._id, req.body)); } catch (err) { next(err); }
}

export async function forgotPassword(req, res, next) {
  try { res.json(await authService.requestPasswordReset(req.body)); } catch (err) { next(err); }
}

export async function resetPassword(req, res, next) {
  try { res.json(await authService.resetPassword(req.body)); } catch (err) { next(err); }
}
