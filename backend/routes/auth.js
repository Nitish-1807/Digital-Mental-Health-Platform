import express from 'express';
import { body } from 'express-validator';
import { register, login, getProfile, logout, googleLogin } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/security.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Registration with validation
router.post('/register', 
  authRateLimiter,
  [
    body('name').isLength({ min: 2, max: 100 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('collegeId').optional().isMongoId(),
    body('role').optional().isIn(['student', 'counselor'])
  ],
  validate,
  register
);

// Login with validation
router.post('/login',
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  validate,
  login
);

router.post('/google', authRateLimiter, googleLogin);

router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, logout);

export default router;
