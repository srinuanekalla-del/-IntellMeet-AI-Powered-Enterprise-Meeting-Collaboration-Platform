import jwt from 'jsonwebtoken';

/**
 * Issues a short-lived access token and a longer-lived refresh token.
 * Access token is sent in the response body; refresh token is set as
 * an httpOnly cookie so it can't be read by client-side JS.
 */
export const generateAccessToken = (user) =>
  jwt.sign(
    { sub: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );

export const generateRefreshToken = (user) =>
  jwt.sign(
    { sub: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
