import express from 'express';
import { addToHistory, getUserHistory } from '../controllers/videoController.js';
import { authenticate, enforceCollegeAccess } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate);
router.use(enforceCollegeAccess);

router.post('/history', roleCheck(['student', 'counselor']), addToHistory);
router.get('/history', roleCheck(['student', 'counselor']), getUserHistory);

export default router;
