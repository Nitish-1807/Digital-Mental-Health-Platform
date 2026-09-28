import express from 'express';
import { authenticate, enforceCollegeAccess } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';
import { getResults, saveResult, submitFlow, deleteResult } from '../controllers/assessmentController.js';

const router = express.Router();

router.use(authenticate);
router.use(enforceCollegeAccess);

router.get('/results',       roleCheck(['student']), getResults);
router.post('/results',      roleCheck(['student']), saveResult);
router.post('/submit-flow',  roleCheck(['student']), submitFlow);
router.delete('/results/:id', roleCheck(['student']), deleteResult);

export default router;