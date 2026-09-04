import { Router } from 'express';
import * as mechanicJobs from '../controllers/mechanic.jobs.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Every mechanic job route requires an authenticated mechanic.
router.use(authenticate, authorize('mechanic'));

router.get('/open', mechanicJobs.listOpen);        // open (pending) job feed
router.get('/active', mechanicJobs.active);        // my current job (or null)
router.get('/:id', mechanicJobs.getOne);           // one job (open or mine)
router.post('/:id/accept', mechanicJobs.accept);   // pending → accepted (atomic)
router.post('/:id/start', mechanicJobs.start);     // accepted → in_progress
router.post('/:id/complete', mechanicJobs.complete); // in_progress → completed (locks)

export default router;
