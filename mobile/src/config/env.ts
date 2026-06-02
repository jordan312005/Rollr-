// Runtime environment. Expo inlines EXPO_PUBLIC_* vars at build time.
export const ENV = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  photoBucket: process.env.EXPO_PUBLIC_SUPABASE_PHOTO_BUCKET ?? 'job-photos',
};

// True only when real Supabase values have been provided (not placeholders).
export const isSupabaseConfigured =
  !!ENV.supabaseUrl &&
  !ENV.supabaseUrl.includes('your-project-ref') &&
  !!ENV.supabaseAnonKey &&
  !ENV.supabaseAnonKey.includes('your-anon-key');
