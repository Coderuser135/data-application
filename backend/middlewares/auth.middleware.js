import { verifyAccessToken } from '../utils/jwt.utils.js';
import User from '../models/user.model.js';
import Session from '../models/session.model.js';

export async function authMiddleware(req, res, next) {
  const token = req.cookies?.accessToken;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  let decoded;
  try { decoded = verifyAccessToken(token); }
  catch { return res.status(401).json({ error: 'Authentication required' }); }

  try {
    const session = await Session.findOne({
      _id: decoded.sid, user_id: decoded.id, revoked_at: null, expires_at: { $gt: new Date() },
    }).select('_id user_id');
    if (!session) return res.status(401).json({ error: 'Session expired or revoked. Please log in again.' });

    const user = await User.findById(decoded.id);
    if (!user || !user.email_verified) return res.status(403).json({ error: 'Please verify your email before accessing your account' });

    req.user = user;
    req.session = session;
    return next();
  } catch (error) { return next(error); }
}
