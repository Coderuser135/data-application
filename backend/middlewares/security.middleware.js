import { isAllowedFrontendOrigin } from '../utils/frontendOrigin.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function originProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  if (!origin) return next();

  if (!isAllowedFrontendOrigin(origin)) {
    console.error('[Origin Protection] Rejected browser origin:', origin);
    return res.status(403).json({ error: 'Request origin is not allowed' });
  }

  return next();
}

export function cronProtection(req, res, next) {
  const secret = process.env.CRON_SECRET;
  const authorization = req.get('authorization');

  if (!secret || authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
}
