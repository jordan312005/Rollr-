// Job API calls (Phase 2) + Supabase Storage photo upload.
import type { ApiClient } from './api';
import { supabase } from './supabase';
import { ENV, isSupabaseConfigured } from '../config/env';

export type Job = {
  id: string;
  customerId: string;
  mechanicId: string | null;
  vehicleType: string;
  vehicleLabel: string;
  description: string;
  photoUrl: string | null;
  location: { lat: number; lng: number } | null;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  // Present on mechanic-facing endpoints (feed / detail / active).
  customerName?: string | null;
};

export type CreateJobInput = {
  vehicleType: string;
  description: string;
  photoUrl?: string | null;
  location?: { lat: number; lng: number } | null;
};

export const getActiveJob = async (api: ApiClient): Promise<Job | null> => {
  const { job } = await api.get<{ job: Job | null }>('/jobs/active');
  return job;
};

export const createJob = (api: ApiClient, input: CreateJobInput) =>
  api.post<Job>('/jobs', input);

export const getJob = (api: ApiClient, id: string) => api.get<Job>(`/jobs/${id}`);

export const cancelJob = (api: ApiClient, id: string) =>
  api.post<Job>(`/jobs/${id}/cancel`);

// ── Mechanic flow (Phase 3) ────────────────────────────────────────────────

/** Open (pending, unassigned) repair requests — the mechanic job feed. */
export const listOpenJobs = async (api: ApiClient): Promise<Job[]> => {
  const { jobs } = await api.get<{ jobs: Job[] }>('/mechanic/jobs/open');
  return jobs;
};

/** The mechanic's current job (accepted / in_progress), or null. */
export const getMechanicActiveJob = async (api: ApiClient): Promise<Job | null> => {
  const { job } = await api.get<{ job: Job | null }>('/mechanic/jobs/active');
  return job;
};

export const getMechanicJob = (api: ApiClient, id: string) =>
  api.get<Job>(`/mechanic/jobs/${id}`);

/** Claim a pending job (atomic; 409 if another mechanic beat us to it). */
export const acceptJob = (api: ApiClient, id: string) =>
  api.post<Job>(`/mechanic/jobs/${id}/accept`);

/** accepted → in_progress */
export const startJob = (api: ApiClient, id: string) =>
  api.post<Job>(`/mechanic/jobs/${id}/start`);

/** in_progress → completed (locks the job) */
export const completeJob = (api: ApiClient, id: string) =>
  api.post<Job>(`/mechanic/jobs/${id}/complete`);

/**
 * Upload a local image URI to Supabase Storage and return a public URL.
 * Non-fatal: returns null on any failure (photo is optional). The caller can
 * still submit the request without a photo.
 *
 * Requires a PUBLIC bucket named ENV.photoBucket in your Supabase project.
 */
export async function uploadJobPhoto(uri: string): Promise<string | null> {
  if (!isSupabaseConfigured) {
    console.warn('[uploadJobPhoto] Supabase not configured — skipping upload.');
    return null;
  }
  try {
    const ext = (uri.split('.').pop() || 'jpg').split('?')[0].toLowerCase();
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const path = `requests/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const res = await fetch(uri);
    const arrayBuffer = await res.arrayBuffer();

    const { error } = await supabase.storage
      .from(ENV.photoBucket)
      .upload(path, arrayBuffer, { contentType, upsert: false });
    if (error) throw error;

    const { data } = supabase.storage.from(ENV.photoBucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (e: any) {
    console.warn('[uploadJobPhoto] failed:', e.message);
    return null;
  }
}
