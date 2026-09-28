import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { scanForRisk, getCrisisResponse } from '../services/riskDetection.js';
import { getCollegeGroup, requireGroupMembership, isGroupModerator } from '../utils/groupAccess.js';

function formatComment(comment) {
  const commentObj = comment.toObject ? comment.toObject() : { ...comment };
  const authorId = commentObj.author?._id || commentObj.author;
  commentObj.authorId = authorId;
  if (commentObj.isAnonymous) {
    commentObj.author = { alias: commentObj.authorAlias };
  }
  return commentObj;
}

function buildCommentTree(flat) {
  const map = new Map();
  flat.forEach((c) => {
    const formatted = { ...c, replies: [] };
    map.set(String(c._id), formatted);
  });
  const roots = [];
  for (const c of flat) {
    const node = map.get(String(c._id));
    const pid = c.parentCommentId ? String(c.parentCommentId) : null;
    if (pid && map.has(pid)) {
      map.get(pid).replies.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortReplies = (nodes) => {
    nodes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    nodes.forEach((n) => sortReplies(n.replies));
  };
  sortReplies(roots);
  return roots;
}

/**
 * Create post (Student only)
 */
export const createPost = async (req, res, next) => {
  try {
    const { title, content, isAnonymous, groupId, isTriggerWarning } = req.body;

    if (!title || !content || !groupId) {
      return res.status(400).json({ message: 'Title, content, and group ID are required' });
    }

    const group = await getCollegeGroup(groupId, req.user.collegeId);
    if (!group) {
      return res.status(404).json({ message: 'Community group not found' });
    }

    const access = await requireGroupMembership(req.user, groupId);
    if (!access.ok) {
      return res.status(403).json({ message: 'Join this group before posting.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const cloaked = Boolean(isAnonymous) && user.role === 'student';

    const riskScan = scanForRisk(`${content} ${title}`);
    let postStatus = 'active';
    let responseMessage = 'Post created successfully';
    let isFlagged = false;
    let flagReason;

    if (riskScan.level === 'crisis') {
      postStatus = 'pending_review';
      isFlagged = true;
      flagReason = 'Automated crisis keyword detection';
      responseMessage = getCrisisResponse();
    }

    const post = await Post.create({
      title,
      content,
      author: req.user.userId,
      authorAlias: cloaked ? user.alias : user.name,
      isAnonymous: cloaked,
      groupId,
      isTriggerWarning: isTriggerWarning || false,
      collegeId: req.user.collegeId,
      status: postStatus,
      isFlagged,
      flagReason
    });

    res.status(201).json({
      message: responseMessage,
      post: postStatus === 'active' ? post : null, // don't return post if it's hidden
      isCrisis: riskScan.level === 'crisis'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all posts for user's college (filtered by groupId)
 */
export const getPosts = async (req, res, next) => {
  try {
    const { groupId } = req.query;
    if (!groupId) {
       return res.status(400).json({ message: 'groupId query parameter is required.' });
    }

    const group = await getCollegeGroup(groupId, req.user.collegeId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const access = await requireGroupMembership(req.user, groupId);
    if (!access.ok) {
      return res.status(403).json({ message: 'You must join this group to view discussions.' });
    }

    const posts = await Post.find({
      collegeId: req.user.collegeId,
      groupId,
      status: 'active',
      isActive: true
    })
      .populate('author', 'name alias role')
      .sort({ isPinned: -1, createdAt: -1 });

    // Hide author info if anonymous, unless it's a counselor (verified professional)
    const formattedPosts = posts.map(post => {
      const postObj = post.toObject();
      if (postObj.isAnonymous && postObj.author?.role !== 'counselor') {
        postObj.author = { alias: postObj.authorAlias };
      }
      return postObj;
    });

    res.json({ posts: formattedPosts });
  } catch (error) {
    next(error);
  }
};

/**
 * @mention autocomplete
 */
export const getMentionCandidates = async (req, res, next) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      collegeId: req.user.collegeId,
      isActive: true,
      status: 'active'
    }).populate('author', 'name alias');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const access = await requireGroupMembership(req.user, post.groupId);
    if (!access.ok) {
      return res.status(403).json({ message: 'You must join this group to view discussions.' });
    }

    const byId = new Map();
    const selfId = req.user.userId.toString();

    const add = (userId, displayName) => {
      if (!userId || !displayName) return;
      const id = userId.toString();
      if (id === selfId) return;
      if (!byId.has(id)) {
        byId.set(id, { userId: id, displayName: String(displayName).trim() });
      }
    };

    const authorId = post.author?._id || post.author;
    if (!post.isAnonymous) {
      add(authorId, post.author?.name || post.authorAlias);
    } else if (authorId?.toString() === selfId) {
      add(authorId, post.authorAlias || post.author?.name);
    }

    const comments = await Comment.find({
      postId: post._id,
      isActive: true
    }).populate('author', 'name alias');

    for (const c of comments) {
      if (c.isAnonymous) continue;
      const uid = c.author?._id || c.author;
      add(uid, c.author?.name || c.authorAlias);
    }

    res.json({ candidates: [...byId.values()] });
  } catch (error) {
    next(error);
  }
};

/**
 * Get post by ID with nested comments
 */
export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      collegeId: req.user.collegeId,
      isActive: true,
      status: 'active'
    }).populate('author', 'name alias role');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const access = await requireGroupMembership(req.user, post.groupId);
    if (!access.ok) {
      return res.status(403).json({ message: 'You must join this group to view discussions.' });
    }

    const comments = await Comment.find({
      postId: post._id,
      isActive: true
    })
      .populate('author', 'name alias role')
      .sort({ createdAt: 1 });

    const postObj = post.toObject();
    if (postObj.isAnonymous && postObj.author?.role !== 'counselor') {
      postObj.author = { alias: postObj.authorAlias };
    }

    const formattedComments = comments.map((comment) => {
       const fmt = formatComment(comment);
       if (fmt.isAnonymous && fmt.author?.role === 'counselor') {
          // Counselors shouldn't be fully anonymous, they retain their professional badge
          fmt.isAnonymous = false;
       }
       return fmt;
    });
    
    const nestedCommentTree = buildCommentTree(formattedComments);

    res.json({
      post: postObj,
      comments: nestedCommentTree
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Support post (formerly Like)
 */
export const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      collegeId: req.user.collegeId,
      isActive: true
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const access = await requireGroupMembership(req.user, post.groupId);
    if (!access.ok) {
      return res.status(403).json({ message: 'Join this group before sending support.' });
    }

    const userIdStr = req.user.userId.toString();
    const supportIndex = post.supports.findIndex((id) => id.toString() === userIdStr);

    if (supportIndex > -1) {
      post.supports.splice(supportIndex, 1);
    } else {
      post.supports.push(req.user.userId);
    }

    await post.save();

    res.json({
      message: supportIndex > -1 ? 'Support removed' : 'Support sent',
      likesCount: post.supports.length,
      supportsCount: post.supports.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Report post
 */
export const reportPost = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    const post = await Post.findOne({
      _id: req.params.id,
      collegeId: req.user.collegeId
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const access = await requireGroupMembership(req.user, post.groupId);
    if (!access.ok) {
      return res.status(403).json({ message: 'You must join this group to report content.' });
    }

    post.isFlagged = true;
    post.flagReason = reason;
    await post.save();

    res.json({ message: 'Post reported successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Pin / unpin discussion (group moderator or admin)
 */
export const togglePin = async (req, res, next) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      collegeId: req.user.collegeId,
      isActive: true
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const group = await getCollegeGroup(post.groupId, req.user.collegeId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const access = await requireGroupMembership(req.user, post.groupId);
    if (!access.ok || !isGroupModerator(req.user, group, access.membership)) {
      return res.status(403).json({ message: 'Only group moderators or admins can pin discussions.' });
    }

    post.isPinned = !post.isPinned;
    await post.save();

    res.json({
      message: post.isPinned ? 'Discussion pinned' : 'Discussion unpinned',
      isPinned: post.isPinned
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete post (Admin only)
 */
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      collegeId: req.user.collegeId
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.isActive = false;
    post.status = 'deleted';
    await post.save();

    // Also deactivate comments
    await Comment.updateMany(
      { postId: post._id },
      { isActive: false }
    );

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
};
