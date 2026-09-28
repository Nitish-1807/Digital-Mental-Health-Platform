import GroupMembership from '../models/GroupMembership.js';
import CommunityGroup from '../models/CommunityGroup.js';

export async function getCollegeGroup(groupId, collegeId) {
  return CommunityGroup.findOne({
    _id: groupId,
    collegeId,
    isActive: true
  });
}

export async function getMembership(userId, groupId) {
  return GroupMembership.findOne({ userId, groupId });
}

/**
 * Admins can access any group in their college.
 * Everyone else must be a member to read/write discussions.
 */
export async function requireGroupMembership(user, groupId) {
  if (user.role === 'admin') {
    return { ok: true, role: 'admin', membership: null };
  }

  const membership = await getMembership(user.userId, groupId);
  if (!membership) {
    return { ok: false, role: null, membership: null };
  }

  return { ok: true, role: membership.role, membership };
}

export function isGroupModerator(user, group, membership) {
  if (user.role === 'admin') return true;
  if (membership?.role === 'moderator') return true;
  return (group.moderatorIds || []).some((id) => id.toString() === user.userId.toString());
}
