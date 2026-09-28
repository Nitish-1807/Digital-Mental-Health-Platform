import User from '../models/User.js';
import Post from '../models/Post.js';
import ChatSession from '../models/ChatSession.js';
import Resource from '../models/Resource.js';
import Booking from '../models/Booking.js';

/**
 * Get all users in college (Admin only)
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {
      collegeId: req.user.collegeId
    };

    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('collegeId', 'name code')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user status (Admin only)
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findOne({
      _id: userId,
      collegeId: req.user.collegeId
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive !== undefined ? isActive : user.isActive;
    await user.save();

    res.json({
      message: 'User status updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get flagged posts (Admin only)
 */
export const getFlaggedPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({
      collegeId: req.user.collegeId,
      isFlagged: true,
      isActive: true
    })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });

    res.json({ posts });
  } catch (error) {
    next(error);
  }
};

/**
 * Get flagged chat sessions (Admin only)
 */
export const getFlaggedChatSessions = async (req, res, next) => {
  try {
    const sessions = await ChatSession.find({
      collegeId: req.user.collegeId,
      isFlagged: true
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ sessions });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard statistics (Admin only)
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const collegeId = req.user.collegeId;

    const [
      totalUsers,
      totalStudents,
      totalCounselors,
      totalResources,
      totalPosts,
      flaggedPosts,
      flaggedSessions,
      totalBookings,
      pendingBookings
    ] = await Promise.all([
      User.countDocuments({ collegeId, isActive: true }),
      User.countDocuments({ collegeId, role: 'student', isActive: true }),
      User.countDocuments({ collegeId, role: 'counselor', isActive: true }),
      Resource.countDocuments({ collegeId, isActive: true }),
      Post.countDocuments({ collegeId, isActive: true }),
      Post.countDocuments({ collegeId, isFlagged: true, isActive: true }),
      ChatSession.countDocuments({ collegeId, isFlagged: true }),
      Booking.countDocuments({ collegeId }),
      Booking.countDocuments({ collegeId, status: 'pending' })
    ]);

    res.json({
      stats: {
        users: {
          total: totalUsers,
          students: totalStudents,
          counselors: totalCounselors
        },
        resources: {
          total: totalResources
        },
        community: {
          totalPosts,
          flaggedPosts
        },
        chat: {
          flaggedSessions
        },
        bookings: {
          total: totalBookings,
          pending: pendingBookings
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Dismiss flag on a post (Admin only)
 */
export const dismissFlaggedPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Post.findOneAndUpdate(
      { _id: id, collegeId: req.user.collegeId },
      { isFlagged: false, flagReason: null },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ message: 'Post flag dismissed', post });
  } catch (error) {
    next(error);
  }
};

/**
 * Resolve a flagged chat session (Admin only)
 */
export const resolveFlaggedSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ChatSession.findOneAndUpdate(
      { _id: id, collegeId: req.user.collegeId },
      { isFlagged: false, flaggedForReview: false, flagReason: 'Resolved by admin' },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Chat session marked as resolved', session });
  } catch (error) {
    next(error);
  }
};
