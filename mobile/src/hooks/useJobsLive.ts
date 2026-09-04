// Live-refresh hook for the `jobs` table.
//
// Subscribes to Supabase Realtime (postgres_changes) and, on any change,
// invokes `onChange` — which the caller uses to refetch from the backend (the
// source of truth). A polling interval runs alongside as a fallback so the
// flow still works even when Realtime/RLS isn't configured in the project.
import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { isSupabaseConfigured } from '../config/env';

type Options = {
  /** Unique channel name (one per subscriber, e.g. `job-<id>` or `jobs-feed`). */
  channelName: string;
  /** Optional postgres_changes row filter, e.g. `id=eq.<jobId>`. */
  filter?: string;
  /** Called whenever a relevant change is detected (realtime or poll tick). */
  onChange: () => void;
  /** Polling fallback interval in ms. */
  pollMs?: number;
};

export function useJobsLive({ channelName, filter, onChange, pollMs = 8000 }: Options) {
  // Keep the latest callback without re-subscribing on every render.
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    if (isSupabaseConfigured) {
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'jobs', ...(filter ? { filter } : {}) },
          () => cb.current()
        )
        .subscribe();
    }

    const interval = setInterval(() => cb.current(), pollMs);

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [channelName, filter, pollMs]);
}
