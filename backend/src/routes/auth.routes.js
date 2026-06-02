import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Customer self-registration (email + password). Login is done client-side
// against Supabase directly, then the app calls GET /me.
router.post('/register', authController.register);

// Admin login (hardcoded creds → backend JWT). Mechanics have NO signup route.
router.post('/admin/login', authController.adminLogin);

// Returns the authenticated user's profile + role (works for all 3 roles).
router.get('/me', authenticate, authController.me);

export default router;
