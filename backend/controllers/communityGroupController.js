import CommunityGroup from '../models/CommunityGroup.js';
import GroupMembership from '../models/GroupMembership.js';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get all groups for user's college.
 * Supports: ?search=X&category=X&tag=X
 */
export const getGroups = async (req, res, next) => {
  try {
    const { search, category, tag } = req.query;
    const filter = { collegeId: req.user.collegeId, isActive: true };

    if (category) {
      filter.category = category;
    }

    if (tag) {
      filter.tags = tag;
    }

    if (search) {
      const q = escapeRegex(search.trim());
      if (q) {
        filter.$or = [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } }
        ];
      }
    }

    const groups = await CommunityGroup.find(filter)
      .populate('moderatorIds', 'name alias role')
      .sort({ memberCount: -1, createdAt: -1 });

    // Fetch user's memberships
    const memberships = await GroupMembership.find({ userId: req.user.userId });
    const joinedGroupIds = memberships.map(m => m.groupId.toString());

    // Gather unique categories for filter UI
    const allGroups = await CommunityGroup.find({ collegeId: req.user.collegeId, isActive: true }).distinct('category');

    res.json({ groups, joinedGroupIds, categories: allGroups });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single group details
 */
export const getGroupById = async (req, res, next) => {
  try {
    const group = await CommunityGroup.findOne({
      _id: req.params.id,
      collegeId: req.user.collegeId,
      isActive: true
    }).populate('moderatorIds', 'name alias role');

    if (!group) return res.status(404).json({ message: 'Group not found' });

    const membership = await GroupMembership.findOne({
      userId: req.user.userId,
      groupId: group._id
    });

    res.json({
      group,
      isMember: !!membership,
      memberRole: membership?.role || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join group
 */
export const joinGroup = async (req, res, next) => {
  try {
    const { id } = req.params;

    const group = await CommunityGroup.findOne({ _id: id, collegeId: req.user.collegeId, isActive: true });
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const existing = await GroupMembership.findOne({ userId: req.user.userId, groupId: id });
    if (existing) return res.json({ message: 'Already a member', alreadyMember: true });

    const role = req.user.role === 'counselor' ? 'moderator' : 'member';
    await GroupMembership.create({ userId: req.user.userId, groupId: id, role });

    if (role === 'moderator' && !group.moderatorIds.some((mid) => mid.toString() === req.user.userId.toString())) {
      group.moderatorIds.push(req.user.userId);
      await group.save();
    }

    await CommunityGroup.findByIdAndUpdate(id, { $inc: { memberCount: 1 } });

    res.json({ message: 'Joined group successfully', role });
  } catch (error) {
    next(error);
  }
};

/**
 * Leave group
 */
export const leaveGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await GroupMembership.findOneAndDelete({ userId: req.user.userId, groupId: id });

    if (deleted) {
      await CommunityGroup.updateOne(
        { _id: id, memberCount: { $gt: 0 } },
        { $inc: { memberCount: -1 } }
      );
    }

    res.json({ message: 'Left group successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Create group (Admin/Counselor)
 */
export const createGroup = async (req, res, next) => {
  try {
    const { name, description, category, tags, icon, isPrivate, rules } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({ message: 'Name, description, and category are required' });
    }

    const group = await CommunityGroup.create({
      name,
      description,
      category,
      tags: Array.isArray(tags) ? tags : String(tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      icon: icon || '💬',
      isPrivate: isPrivate || false,
      rules: Array.isArray(rules) ? rules : String(rules || '').split('\n').map((r) => r.trim()).filter(Boolean),
      moderatorIds: [req.user.userId],
      collegeId: req.user.collegeId,
      memberCount: 1
    });

    await GroupMembership.create({
      userId: req.user.userId,
      groupId: group._id,
      role: 'moderator'
    });

    res.status(201).json({ message: 'Group created', group });
  } catch (error) {
    next(error);
  }
};

/**
 * Update group (Moderator/Admin)
 */
export const updateGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, category, tags, icon, isPrivate, rules } = req.body;

    const group = await CommunityGroup.findOne({ _id: id, collegeId: req.user.collegeId });
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check if user is a moderator or admin
    const isMod = group.moderatorIds.some(mid => mid.toString() === req.user.userId.toString());
    if (!isMod && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only moderators or admins can update this group' });
    }

    if (name) group.name = name;
    if (description) group.description = description;
    if (category) group.category = category;
    if (tags) group.tags = tags;
    if (icon) group.icon = icon;
    if (typeof isPrivate === 'boolean') group.isPrivate = isPrivate;
    if (rules) group.rules = rules;

    await group.save();
    res.json({ message: 'Group updated', group });
  } catch (error) {
    next(error);
  }
};
