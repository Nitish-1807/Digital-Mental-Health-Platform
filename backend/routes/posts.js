import express from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  getMentionCandidates,
  toggleLike,
  togglePin,
  reportPost,
  deletePost
} from '../controllers/postController.js';
import {
  createComment,
  deleteComment
} from '../controllers/commentController.js';
import { authenticate } from '../middleware/auth.js';
import { enforceCollegeAccess } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = express.Router();

// All routes require authentication and college access
router.use(authenticate);
router.use(enforceCollegeAccess);

// Post routes
router.post('/', roleCheck(['student', 'counselor']), createPost);
router.get('/', roleCheck(['student', 'counselor', 'admin']), getPosts);
router.get('/:id/mention-candidates', roleCheck(['student', 'counselor']), getMentionCandidates);
router.get('/:id', roleCheck(['student', 'counselor', 'admin']), getPostById);
router.post('/:id/like', roleCheck(['student', 'counselor']), toggleLike);
router.post('/:id/pin', roleCheck(['student', 'counselor', 'admin']), togglePin);
router.post('/:id/report', roleCheck(['student', 'counselor']), reportPost);
router.delete('/:id', roleCheck(['admin']), deletePost);

// Comment routes
router.post('/:postId/comments', roleCheck(['student', 'counselor']), createComment);
router.delete('/comments/:id', roleCheck(['student', 'admin', 'counselor']), deleteComment);

export default router;
