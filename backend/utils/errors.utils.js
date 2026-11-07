export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err?.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors || {}).map((item) => item.message).join(', ') || 'Validation failed';
  } else if (err?.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier';
  } else if (err?.code === 11000) {
    statusCode = 409;
    message = 'A record with the same unique value already exists';
  } else if (statusCode >= 500) {
    message = process.env.NODE_ENV === 'production' ? 'Internal server error' : message;
  }

  if (statusCode >= 400) {
    console.error(JSON.stringify({
      level: 'error',
      requestId: req.requestId || null,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      errorName: err.name || 'Error',
      message: err.message || 'Request failed',
    }));
  }
  res.status(statusCode).json({ error: message });
}
