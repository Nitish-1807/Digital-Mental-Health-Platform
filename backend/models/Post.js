import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorAlias: {
    type: String,
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityGroup',
    required: true,
    index: true
  },
  isTriggerWarning: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false,
    index: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'pending_review', 'deleted'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  supports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Indexes
postSchema.index({ collegeId: 1, createdAt: -1 });
postSchema.index({ collegeId: 1, isFlagged: 1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
