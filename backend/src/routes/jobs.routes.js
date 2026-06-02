import { Router } from 'express';
import * as jobsController from '../controllers/jobs.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All job routes require an authenticated customer (Phase 2).
router.use(authenticate, authorize('customer'));

router.post('/', jobsController.create);          // create repair request
router.get('/active', jobsController.active);     // current active job (or null)
router.get('/', jobsController.list);             // history of my jobs
router.get('/:id', jobsController.getOne);        // one job (must be mine)
router.post('/:id/cancel', jobsController.cancel);// cancel (pending only)

// TODO(Phase 3 — Mechanic flow): mount mechanic routes (accept / update status)
//   under authorize('mechanic'), e.g. routes/mechanic.jobs.routes.js

export default router;
