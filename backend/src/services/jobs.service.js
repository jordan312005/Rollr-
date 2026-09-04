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

// ──────────────────────────────────────────────────────────────────────────
// Phase 3 — Mechanic flow
// ──────────────────────────────────────────────────────────────────────────

// Statuses a mechanic is actively working (their "current job").
const MECHANIC_ACTIVE_STATUSES = ['accepted', 'in_progress'];

/** Like shape(), but also includes the customer's name (joined). */
function shapeWithCustomer(row) {
  const job = shape(row);
  if (!job) return null;
  return { ...job, customerName: row.customer_name ?? null };
}

/**
 * All open (pending, unassigned) repair requests — the mechanic job feed.
 * Oldest first so the longest-waiting customer surfaces at the top.
 */
export async function listOpenJobs() {
  const { rows } = await pool.query(
    `select j.*, u.full_name as customer_name
       from jobs j
       join users u on u.id = j.customer_id
      where j.status = 'pending' and j.mechanic_id is null
      order by j.created_at asc`
  );
  return rows.map(shapeWithCustomer);
}

/** The mechanic's current job (accepted or in_progress), or null. */
export async function getMechanicActiveJob(mechanicId) {
  const { rows } = await pool.query(
    `select j.*, u.full_name as customer_name
       from jobs j
       join users u on u.id = j.customer_id
      where j.mechanic_id = $1 and j.status = any($2)
      order by j.updated_at desc limit 1`,
    [mechanicId, MECHANIC_ACTIVE_STATUSES]
  );
  return shapeWithCustomer(rows[0]);
}

/**
 * Fetch one job the mechanic is allowed to view: either still open (pending,
 * unassigned) or already assigned to this mechanic.
 */
export async function getJobForMechanic(mechanicId, jobId) {
  const { rows } = await pool.query(
    `select j.*, u.full_name as customer_name
       from jobs j
       join users u on u.id = j.customer_id
      where j.id = $1`,
    [jobId]
  );
  const row = rows[0];
  if (!row) throw new ApiError(404, 'Job not found');
  const isOpen = row.status === 'pending' && row.mechanic_id == null;
  const isMine = row.mechanic_id === mechanicId;
  if (!isOpen && !isMine) throw new ApiError(403, 'This job is assigned to another mechanic');
  return shapeWithCustomer(row);
}

/**
 * Accept a pending job. The update is atomic and guarded on
 * `status = 'pending' AND mechanic_id IS NULL`, so only the first mechanic to
 * accept wins — concurrent accepts get a 409 and the job vanishes from every
 * other feed.
 */
export async function acceptJob(mechanicId, jobId) {
  const { rows } = await pool.query(
    `update jobs
        set status = 'accepted', mechanic_id = $1
      where id = $2 and status = 'pending' and mechanic_id is null
      returning *`,
    [mechanicId, jobId]
  );
  if (!rows[0]) {
    // Either it doesn't exist or someone already took / progressed it.
    const { rows: existing } = await pool.query('select id from jobs where id = $1', [jobId]);
    if (!existing[0]) throw new ApiError(404, 'Job not found');
    throw new ApiError(409, 'This job has already been accepted by another mechanic');
  }
  return shape(rows[0]);
}

// Allowed forward transitions for the assigned mechanic.
const NEXT_STATUS = { accepted: 'in_progress', in_progress: 'completed' };

/**
 * Advance a job the mechanic owns to the next status.
 * @param {'in_progress'|'completed'} target
 */
export async function advanceJobStatus(mechanicId, jobId, target) {
  const { rows } = await pool.query('select * from jobs where id = $1', [jobId]);
  const job = rows[0];
  if (!job) throw new ApiError(404, 'Job not found');
  if (job.mechanic_id !== mechanicId) throw new ApiError(403, 'Not your job');

  // Completed (and cancelled) are terminal — the job is locked.
  if (job.status === 'completed') throw new ApiError(409, 'This job is already completed and locked');
  if (job.status === 'cancelled') throw new ApiError(409, 'This job was cancelled');

  const expected = NEXT_STATUS[job.status];
  if (expected !== target) {
    throw new ApiError(409, `Cannot move a "${job.status}" job to "${target}"`);
  }

  const { rows: updated } = await pool.query(
    `update jobs set status = $1 where id = $2 returning *`,
    [target, jobId]
  );
  return shape(updated[0]);
}
