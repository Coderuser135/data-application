import { authMiddleware } from './auth.middleware.js';

export function adminMiddleware(req, res, next) {
  return authMiddleware(req, res, (error) => {
    if (error) return next(error);

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    return next();
  });
}
