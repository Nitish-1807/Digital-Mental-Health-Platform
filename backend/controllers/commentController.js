import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { requireGroupMembership } from '../utils/groupAccess.js';

/**
 * Create comment on post
 */
export const createComment = async (req, res, next) => {
  try {
    const { content, isAnonymous, parentCommentId, mentions } = req.body;
    const { postId } = req.params;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const post = await Post.findOne({
      _id: postId,
      collegeId: req.user.collegeId,
      isActive: true
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const access = await requireGroupMembership(req.user, post.groupId);
    if (!access.ok) {
      return res.status(403).json({ message: 'Join this group before commenting.' });
    }

    let parentId = null;
    if (parentCommentId) {
      const parent = await Comment.findOne({
        _id: parentCommentId,
        postId,
        isActive: true
      });
      if (!parent) {
        return res.status(400).json({ message: 'Invalid parent comment for this post' });
      }
      parentId = parent._id;
    }

    const mentionList = Array.isArray(mentions)
      ? mentions.map((m) => String(m).trim()).filter(Boolean)
      : [];

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const comment = await Comment.create({
      postId,
      author: req.user.userId,
      authorAlias: isAnonymous ? user.alias : user.name,
      content,
      isAnonymous: isAnonymous || false,
      collegeId: req.user.collegeId,
      parentCommentId: parentId,
      mentions: mentionList
    });

    res.status(201).json({
      message: 'Comment created successfully',
      comment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete comment
 */
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.id,
      collegeId: req.user.collegeId
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    comment.isActive = false;
    await comment.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
