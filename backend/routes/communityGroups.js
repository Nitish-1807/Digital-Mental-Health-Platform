import express from 'express';
import { getGroups, getGroupById, joinGroup, leaveGroup, createGroup, updateGroup } from '../controllers/communityGroupController.js';
import { authenticate, enforceCollegeAccess } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate);
router.use(enforceCollegeAccess);

// Browse/search groups
router.get('/', getGroups);

// Get single group detail
router.get('/:id', getGroupById);

// Join/Leave (students and counselors)
router.post('/:id/join', roleCheck(['student', 'counselor', 'admin']), joinGroup);
router.post('/:id/leave', roleCheck(['student', 'counselor', 'admin']), leaveGroup);

// Create group (admin, counselor, student)
router.post('/', roleCheck(['admin', 'counselor', 'student']), createGroup);

// Update group (moderator or admin — checked inside controller)
router.put('/:id', roleCheck(['admin', 'counselor', 'student']), updateGroup);

export default router;
