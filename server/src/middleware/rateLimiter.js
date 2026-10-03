import rateLimit from 'express-rate-limit';

// Prevents brute-force attacks on login/signup: 20 requests per 15 min per IP.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later.' },
});
