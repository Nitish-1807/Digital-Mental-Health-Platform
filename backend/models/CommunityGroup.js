import mongoose from 'mongoose';

const communityGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
  tags: { type: [String], default: [], index: true },
  icon: { type: String, default: '💬' },
  isPrivate: { type: Boolean, default: false },
  rules: { type: [String], default: [] },
  moderatorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  memberCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Text index for search
communityGroupSchema.index({ name: 'text', description: 'text', tags: 'text' });

const CommunityGroup = mongoose.model('CommunityGroup', communityGroupSchema);
export default CommunityGroup;
