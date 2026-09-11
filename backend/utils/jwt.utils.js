import jwt from 'jsonwebtoken';

export function generateAccessToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(user) {
  return jwt.sign({ id: user._id.toString() }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}
