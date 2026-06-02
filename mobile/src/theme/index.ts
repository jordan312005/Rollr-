// Minimal shared design tokens.
export const colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  danger: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
  accent: '#0EA5E9',
  white: '#FFFFFF',
};

export const spacing = (n: number) => n * 8;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

// Visual mapping for job statuses (used by StatusBadge + progress tracker).
export const STATUS_STEPS = ['pending', 'accepted', 'in_progress', 'completed'] as const;
export type JobStatus = (typeof STATUS_STEPS)[number] | 'cancelled';

export const statusMeta: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: colors.warning },
  accepted: { label: 'Accepted', color: colors.accent },
  in_progress: { label: 'In Progress', color: colors.primary },
  completed: { label: 'Completed', color: colors.success },
  cancelled: { label: 'Cancelled', color: colors.muted },
};
