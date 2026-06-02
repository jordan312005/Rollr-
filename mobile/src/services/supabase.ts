// Supabase client for the mobile app (handles customer & mechanic auth sessions).
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { ENV } from '../config/env';

// Fall back to a syntactically-valid placeholder so createClient never throws
// when keys aren't configured yet. Calls will fail gracefully at runtime.
const url = ENV.supabaseUrl || 'https://placeholder.supabase.co';
const anonKey = ENV.supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
