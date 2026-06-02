// Jobs business logic (Phase 2 — customer repair requests).
import { pool } from '../db/pool.js';
import { ApiError } from '../middleware/errorHandler.js';
import { isValidVehicleType, vehicleLabel } from '../config/vehicleTypes.js';

const ACTIVE_STATUSES = ['pending', 'accepted', 'in_progress'];

function shape(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerId: row.customer_id,
    mechanicId: row.mechanic_id,
    vehicleType: row.vehicle_type_key,
    vehicleLabel: vehicleLabel(row.vehicle_type_key),
    description: row.description,
    photoUrl: row.photo_url,
    location:
      row.location_lat != null && row.location_lng != null
        ? { lat: row.location_lat, lng: row.location_lng }
        : null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Create a new repair request for a customer. Status starts as `pending`. */
export async function createJob(customerId, body) {
  const { vehicleType, description, photoUrl, location } = body || {};

  if (!isValidVehicleType(vehicleType)) {
    throw new ApiError(400, 'Invalid or missing vehicleType');
  }
  if (!description || !description.trim()) {
    throw new ApiError(400, 'A problem description is required');
  }

  // Business rule: one active request at a time.
  const existing = await getActiveJob(customerId);
  if (existing) {
    throw new ApiError(409, 'You already have an active repair request');
  }

  const lat = location?.lat ?? null;
  const lng = location?.lng ?? null;

  const { rows } = await pool.query(
    `insert into jobs (customer_id, vehicle_type_key, description, photo_url, location_lat, location_lng, status)
     values ($1, $2, $3, $4, $5, $6, 'pending')
     returning *`,
    [customerId, vehicleType, description.trim(), photoUrl || null, lat, lng]
  );
  return shape(rows[0]);
}

/** The customer's current active (non-terminal) job, or null. */
export async function getActiveJob(customerId) {
  const { rows } = await pool.query(
    `select * from jobs
     where customer_id = $1 and status = any($2)
     order by created_at desc limit 1`,
    [customerId, ACTIVE_STATUSES]
  );
  return shape(rows[0]);
}

export async function getJobById(customerId, jobId) {
  const { rows } = await pool.query('select * from jobs where id = $1', [jobId]);
  const job = rows[0];
  if (!job) throw new ApiError(404, 'Job not found');
  if (job.customer_id !== customerId) throw new ApiError(403, 'Not your job');
  return shape(job);
}

export async function listMyJobs(customerId) {
  const { rows } = await pool.query(
    'select * from jobs where customer_id = $1 order by created_at desc',
    [customerId]
  );
  return rows.map(shape);
}

/** Cancel a job — only permitted while status is `pending`. */
export async function cancelJob(customerId, jobId) {
  const job = await getJobById(customerId, jobId); // throws if not found / not owner
  if (job.status !== 'pending') {
    throw new ApiError(409, `Cannot cancel a job that is "${job.status}"`);
  }
  const { rows } = await pool.query(
    `update jobs set status = 'cancelled' where id = $1 returning *`,
    [jobId]
  );
  return shape(rows[0]);
}

// TODO(Phase 3 — Mechanic flow): acceptJob(mechanicId, jobId),
//   updateStatus(mechanicId, jobId, 'in_progress'|'completed'), listOpenJobs().
