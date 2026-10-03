import { Meeting } from '../models/Meeting.js';
import { notifyUser } from '../services/notificationService.js';

// POST /api/meetings
export const createMeeting = async (req, res, next) => {
  try {
    const { title, scheduledAt } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const meeting = await Meeting.create({
      title,
      scheduledAt,
      host: req.user._id,
      participants: [req.user._id],
    });

    res.status(201).json({ meeting });
  } catch (error) {
    next(error);
  }
};

// GET /api/meetings — meetings the user hosts or is part of
export const listMeetings = async (req, res, next) => {
  try {
    const meetings = await Meeting.find({
      $or: [{ host: req.user._id }, { participants: req.user._id }],
    }).sort({ scheduledAt: -1 });

    res.json({ meetings });
  } catch (error) {
    next(error);
  }
};

// GET /api/meetings/:id
export const getMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('host', 'name email')
      .populate('participants', 'name email');

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json({ meeting });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/meetings/:id — e.g. change status to live/ended, add participants
export const updateMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (String(meeting.host) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the host can update this meeting' });
    }

    Object.assign(meeting, req.body);
    await meeting.save();
    res.json({ meeting });
  } catch (error) {
    next(error);
  }
};

// POST /api/meetings/:id/participants — invite a user, notified live via Socket.io
export const addParticipant = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (String(meeting.host) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the host can invite participants' });
    }

    if (!meeting.participants.map(String).includes(userId)) {
      meeting.participants.push(userId);
      await meeting.save();
    }

    await notifyUser(req.io, {
      recipient: userId,
      type: 'meeting-invite',
      message: `${req.user.name} invited you to "${meeting.title}"`,
      meeting: meeting._id,
    });

    res.json({ meeting });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/meetings/:id
export const deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (String(meeting.host) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the host can delete this meeting' });
    }

    await meeting.deleteOne();
    res.json({ message: 'Meeting deleted' });
  } catch (error) {
    next(error);
  }
};