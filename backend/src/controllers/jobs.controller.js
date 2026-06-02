import * as jobsService from '../services/jobs.service.js';

export async function create(req, res, next) {
  try {
    const job = await jobsService.createJob(req.user.id, req.body);
    res.status(201).json(job);
  } catch (err) { next(err); }
}

export async function active(req, res, next) {
  try {
    const job = await jobsService.getActiveJob(req.user.id);
    res.json({ job }); // job may be null
  } catch (err) { next(err); }
}

export async function list(req, res, next) {
  try {
    const jobs = await jobsService.listMyJobs(req.user.id);
    res.json({ jobs });
  } catch (err) { next(err); }
}

export async function getOne(req, res, next) {
  try {
    const job = await jobsService.getJobById(req.user.id, req.params.id);
    res.json(job);
  } catch (err) { next(err); }
}

export async function cancel(req, res, next) {
  try {
    const job = await jobsService.cancelJob(req.user.id, req.params.id);
    res.json(job);
  } catch (err) { next(err); }
}
