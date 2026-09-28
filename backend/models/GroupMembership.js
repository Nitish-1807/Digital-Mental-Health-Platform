import mongoose from 'mongoose';

const groupMembershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityGroup', required: true, index: true },
  role: { type: String, enum: ['member', 'moderator'], default: 'member' },
  joinedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

groupMembershipSchema.index({ userId: 1, groupId: 1 }, { unique: true });

const GroupMembership = mongoose.model('GroupMembership', groupMembershipSchema);
export default GroupMembership;
