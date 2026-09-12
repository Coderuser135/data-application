const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function allowedOrigins() {
  return String(process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function originProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.get('origin');
  if (!origin) return next();
  if (!allowedOrigins().includes(origin)) {
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
