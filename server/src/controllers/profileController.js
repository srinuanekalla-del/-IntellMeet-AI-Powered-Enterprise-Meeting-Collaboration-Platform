import { User } from '../models/User.js';

// GET /api/profile/me
export const getMyProfile = async (req, res) => {
  res.json({ user: req.user });
};

// PATCH /api/profile/me
export const updateMyProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (name) req.user.name = name;
    await req.user.save();
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

// POST /api/profile/avatar  (multipart/form-data, field name: "avatar")
export const uploadMyAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    req.user.avatarUrl = req.file.path; // Cloudinary CDN URL
    await req.user.save();

    res.json({ avatarUrl: req.user.avatarUrl });
  } catch (error) {
    next(error);
  }
};

// POST /api/profile/invite — invite a teammate by email (Day 2/3 scope: stub)
export const inviteTeammate = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Week 3 will wire this to an email service + Team model.
    // For now, confirm the invite was accepted for processing.
    res.status(202).json({ message: `Invite queued for ${email}` });
  } catch (error) {
    next(error);
  }
};
