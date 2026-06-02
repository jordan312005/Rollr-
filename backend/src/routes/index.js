import { Router } from 'express';
import authRoutes from './auth.routes.js';
import jobsRoutes from './jobs.routes.js';
import { VEHICLE_TYPES } from '../config/vehicleTypes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ ok: true, service: 'rollr-api' }));

// Public: vehicle types config (so the app could fetch it dynamically too).
router.get('/vehicle-types', (req, res) => res.json({ vehicleTypes: VEHICLE_TYPES }));

router.use('/auth', authRoutes);
router.use('/jobs', jobsRoutes);

export default router;
