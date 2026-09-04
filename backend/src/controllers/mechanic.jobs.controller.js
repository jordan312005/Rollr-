// Mechanic job-flow controllers (Phase 3).
import * as jobsService from '../services/jobs.service.js';

export async function listOpen(req, res, next) {
  try {
    const jobs = await jobsService.listOpenJobs();
    res.json({ jobs });
  } catch (err) { next(err); }
}

export async function active(req, res, next) {
  try {
    const job = await jobsService.getMechanicActiveJob(req.user.id);
    res.json({ job }); // job may be null
  } catch (err) { next(err); }
}

export async function getOne(req, res, next) {
  try {
    const job = await jobsService.getJobForMechanic(req.user.id, req.params.id);
    res.json(job);
  } catch (err) { next(err); }
}

export async function accept(req, res, next) {
  try {
    const job = await jobsService.acceptJob(req.user.id, req.params.id);
    res.json(job);
  } catch (err) { next(err); }
}

export async function start(req, res, next) {
  try {
    const job = await jobsService.advanceJobStatus(req.user.id, req.params.id, 'in_progress');
    res.json(job);
  } catch (err) { next(err); }
}

export async function complete(req, res, next) {
  try {
    const job = await jobsService.advanceJobStatus(req.user.id, req.params.id, 'completed');
    res.json(job);
  } catch (err) { next(err); }
}
