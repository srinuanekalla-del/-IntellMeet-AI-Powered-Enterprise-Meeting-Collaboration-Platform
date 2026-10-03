import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

/**
 * Verifies the access token from the Authorization header
 * and attaches the authenticated user to req.user.
 */
export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

/**
 * Restricts a route to specific roles, e.g. requireRole('Admin').
 * Use after `protect` so req.user is already populated.
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  next();
};
