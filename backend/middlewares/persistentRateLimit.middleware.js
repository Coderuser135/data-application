import AuthRateLimit from '../models/authRateLimit.model.js';

export function persistentRateLimit({ windowMs, limit, message }) {
  return async function rateLimitMiddleware(req, res, next) {
    try {
      const now = new Date();
      const key = `auth:${req.baseUrl}${req.path}:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
      const resetAt = new Date(now.getTime() + windowMs);
      const updatePipeline = [{
        $set: {
          count: {
            $cond: [
              { $gt: ['$reset_at', now] },
              { $add: [{ $ifNull: ['$count', 0] }, 1] },
              1,
            ],
          },
          reset_at: {
            $cond: [
              { $gt: ['$reset_at', now] },
              '$reset_at',
              resetAt,
            ],
          },
        },
      }];

      let counter;
      try {
        counter = await AuthRateLimit.findOneAndUpdate(
          { key },
          updatePipeline,
          { upsert: true, new: true }
        );
      } catch (error) {
        if (error?.code !== 11000) throw error;
        counter = await AuthRateLimit.findOneAndUpdate(
          { key },
          updatePipeline,
          { new: true }
        );
      }

      res.set('RateLimit-Limit', String(limit));
      res.set('RateLimit-Remaining', String(Math.max(0, limit - counter.count)));
      res.set('RateLimit-Reset', String(Math.ceil(counter.reset_at.getTime() / 1000)));

      if (counter.count > limit) {
        res.set('Retry-After', String(Math.max(1, Math.ceil((counter.reset_at.getTime() - Date.now()) / 1000))));
        return res.status(429).json({ error: message || 'Too many requests. Try again later.' });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}
