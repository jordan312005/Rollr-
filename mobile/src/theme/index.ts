// Shared design tokens.
//
// Palette is sourced from roller_logo.png (sampled red: RGB 162,0,19 = #A20013).
// `primary` is that exact logo red, reserved for fills — gradients, buttons,
// filled tracker steps. `primaryBright` is a lifted variant for foreground use
// (text, icons, borders, badges) where the raw logo red doesn't read clearly
// against near-black.
export const colors = {
  // Backgrounds
  bg: '#0D0D0D',
  surface: '#161616', // flat surface: inputs, list rows, small chips
  surfaceTop: '#1C1C1C', // gradient stop — top
  surfaceBottom: '#101010', // gradient stop — bottom
  card: '#161616',

  // Borders
  border: '#262626',
  borderSoft: 'rgba(255,255,255,0.08)',

  // Text
  text: '#F2F2F2',
  muted: '#9A9A9A',
  faint: '#5C5C5C',

  // Brand accent
  primary: '#A20013',
  primaryBright: '#C81E3A',
  primaryPressed: '#7A000E',

  // Semantic
  success: '#2FA84F',
  warning: '#D9A441',
  accent: '#6B84A0',
  danger: '#C81E3A',

  white: '#FFFFFF',
  black: '#000000',
};

export const gradients = {
  surface: [colors.surfaceTop, colors.surfaceBottom] as const,
};

export const spacing = (n: number) => n * 8;

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };

// Visual mapping for job statuses (used by StatusBadge + progress tracker).
export const STATUS_STEPS = ['pending', 'accepted', 'in_progress', 'completed'] as const;
export type JobStatus = (typeof STATUS_STEPS)[number] | 'cancelled';

export const statusMeta: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: colors.warning },
  accepted: { label: 'Accepted', color: colors.accent },
  in_progress: { label: 'In Progress', color: colors.primaryBright },
  completed: { label: 'Completed', color: colors.success },
  cancelled: { label: 'Cancelled', color: colors.muted },
};
