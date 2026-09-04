// Auth context — a single sign-in flow for all three roles.
//
//  • Customer / Mechanic → authenticate against Supabase (email + password).
//  • Admin               → authenticate against the backend (hardcoded creds),
//                          which returns a backend-signed JWT stored locally.
//
// There is no role picker: `signIn` tries Supabase first, then falls back to
// the admin endpoint, and the role is always read back from the backend
// (GET /api/auth/me) rather than assumed from which screen the user came from.
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { createApiClient, type ApiClient } from '../services/api';

export type Role = 'customer' | 'mechanic' | 'admin';
export type AppUser = { id: string; email: string; role: Role; fullName?: string | null };

const ADMIN_TOKEN_KEY = 'rollr.adminToken';

type AuthContextValue = {
  status: 'loading' | 'ready';
  user: AppUser | null;
  api: ApiClient;
  registerCustomer: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [user, setUser] = useState<AppUser | null>(null);
  const adminTokenRef = useRef<string | null>(null);

  // Token provider used by the API client for every request.
  const getToken = useMemo(
    () => async (): Promise<string | null> => {
      if (adminTokenRef.current) return adminTokenRef.current;
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    },
    []
  );

  const api = useMemo(() => createApiClient(getToken), [getToken]);

  const fetchProfile = async (): Promise<AppUser> => {
    return api.get<AppUser>('/auth/me');
  };

  // Bootstrap: restore an existing session (admin JWT or Supabase session).
  useEffect(() => {
    (async () => {
      try {
        const savedAdmin = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
        if (savedAdmin) {
          adminTokenRef.current = savedAdmin;
          try {
            setUser(await fetchProfile());
          } catch {
            adminTokenRef.current = null;
            await AsyncStorage.removeItem(ADMIN_TOKEN_KEY);
          }
        } else {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            try {
              setUser(await fetchProfile());
            } catch {
              /* leave signed out if profile fetch fails */
            }
          }
        }
      } finally {
        setStatus('ready');
      }
    })();

    // React to Supabase sign-out events from other places.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && !adminTokenRef.current) setUser(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Single entry point for every role. No role is chosen up front — we try
  // Supabase (customer/mechanic) first, then fall back to the admin endpoint,
  // and let the backend tell us who the account actually belongs to.
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      setUser(await fetchProfile());
      return;
    }

    try {
      const { token, user: adminUser } = await api.post<{ token: string; user: AppUser }>(
        '/auth/admin/login',
        { email, password }
      );
      adminTokenRef.current = token;
      await AsyncStorage.setItem(ADMIN_TOKEN_KEY, token);
      setUser({ ...adminUser, role: 'admin' });
    } catch {
      throw new Error('Invalid email or password');
    }
  };

  const registerCustomer = async (email: string, password: string, fullName: string) => {
    // Backend creates the Supabase auth user + users row (role=customer)…
    await api.post('/auth/register', { email, password, fullName });
    // …then sign in normally.
    await signIn(email, password);
  };

  const signOut = async () => {
    adminTokenRef.current = null;
    await AsyncStorage.removeItem(ADMIN_TOKEN_KEY);
    await supabase.auth.signOut();
    setUser(null);
  };

  const value: AuthContextValue = {
    status,
    user,
    api,
    registerCustomer,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
