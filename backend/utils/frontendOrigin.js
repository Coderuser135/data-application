const PRODUCTION_FRONTEND_ORIGIN = 'https://heavengymfrontend-application.vercel.app';
const LOCAL_FRONTEND_ORIGIN = 'http://localhost:5173';

// Vercel preview hostnames for this one frontend project follow:
// heavengymfrontend-application-<deployment-and-team-slug>.vercel.app
const FRONTEND_PREVIEW_ORIGIN = /^https:\/\/heavengymfrontend-application-[a-z0-9-]+\.vercel\.app$/i;

function normalizeOrigin(origin) {
  const value = String(origin || '').trim();
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function isAllowedFrontendOrigin(origin) {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  const configuredOrigins = String(process.env.CLIENT_URL || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  return (
    normalizedOrigin === PRODUCTION_FRONTEND_ORIGIN ||
    normalizedOrigin === LOCAL_FRONTEND_ORIGIN ||
    configuredOrigins.includes(normalizedOrigin) ||
    FRONTEND_PREVIEW_ORIGIN.test(normalizedOrigin)
  );
}
