import { verifyAccessToken } from '../utils/jwt.utils.js';
import User from '../models/user.model.js';

export async function authMiddleware(req, res, next) {
  const token = req.cookies?.accessToken;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Authentication required' });
  }
}
