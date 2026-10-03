import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateTokens.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// POST /api/auth/signup
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh — issues a new access token using the httpOnly cookie
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.sub);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
  res.json({ message: 'Logged out' });
};
