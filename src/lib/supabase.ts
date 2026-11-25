import {
  createClient,
  type AuthChangeEvent,
  type AuthError,
  type Session,
  type SupabaseClient,
  type User,
} from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const isConfigured =
  Boolean(rawUrl) &&
  Boolean(rawAnonKey) &&
  !rawUrl?.includes('placeholder.supabase.co');

if (!isConfigured) {
  console.warn(
    '[AI Studio] Supabase URL ou Anon Key não configuradas — usando autenticação local em memória/navegador.'
  );
}

const MOCK_USERS_KEY = 'sap_basis_mock_users_v1';
const MOCK_SESSION_KEY = 'sap_basis_mock_session_v1';

interface MockUserRecord {
  id: string;
  email: string;
  password: string;
  full_name?: string;
}

function readMockUsers(): MockUserRecord[] {
  try {
    const raw = window.localStorage.getItem(MOCK_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMockUsers(users: MockUserRecord[]): void {
  try {
    window.localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage errors
  }
}

function buildMockSession(userRecord: MockUserRecord): Session {
  const now = Math.floor(Date.now() / 1000);
  const user: User = {
    id: userRecord.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: userRecord.email,
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: userRecord.full_name || '' },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    access_token: `mock-access-token-${userRecord.id}`,
    refresh_token: `mock-refresh-token-${userRecord.id}`,
    expires_in: 3600,
    expires_at: now + 3600,
    token_type: 'bearer',
    user,
  };
}

function createMockSupabaseClient(): SupabaseClient {
  type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;
  const listeners = new Set<AuthListener>();

  const loadSession = (): Session | null => {
    try {
      const raw = window.localStorage.getItem(MOCK_SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as Session;
    } catch {
      return null;
    }
  };

  const persistSession = (session: Session | null) => {
    try {
      if (session) {
        window.localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(MOCK_SESSION_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  };

  const emitAuthEvent = (event: AuthChangeEvent, session: Session | null) => {
    listeners.forEach((cb) => {
      try {
        cb(event, session);
      } catch (err) {
        console.error('Auth listener error:', err);
      }
    });
  };

  const mockAuth = {
    async getSession() {
      return { data: { session: loadSession() }, error: null as AuthError | null };
    },

    onAuthStateChange(callback: AuthListener) {
      listeners.add(callback);
      return {
        data: {
          subscription: {
            id: `mock-sub-${Date.now()}`,
            callback,
            unsubscribe: () => {
              listeners.delete(callback);
            },
          },
        },
      };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const normalizedEmail = email.trim().toLowerCase();
      const users = readMockUsers();
      let record = users.find((u) => u.email.toLowerCase() === normalizedEmail);

      // If no users have been registered yet in this browser, allow immediate local login
      if (!record && users.length === 0) {
        record = {
          id: `local-${Date.now()}`,
          email: email.trim(),
          password,
        };
        writeMockUsers([record]);
      } else if (!record || record.password !== password) {
        return {
          data: { user: null, session: null },
          error: {
            name: 'AuthApiError',
            message: 'Invalid login credentials',
            status: 400,
          } as unknown as AuthError,
        };
      }

      const session = buildMockSession(record);
      persistSession(session);
      emitAuthEvent('SIGNED_IN', session);
      return {
        data: { user: session.user, session },
        error: null as AuthError | null,
      };
    },

    async signUp({
      email,
      password,
      options,
    }: {
      email: string;
      password: string;
      options?: { data?: { full_name?: string } };
    }) {
      const normalizedEmail = email.trim().toLowerCase();
      const users = readMockUsers();
      if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        return {
          data: { user: null, session: null },
          error: {
            name: 'AuthApiError',
            message: 'User already registered',
            status: 400,
          } as unknown as AuthError,
        };
      }

      const record: MockUserRecord = {
        id: `local-${Date.now()}`,
        email: email.trim(),
        password,
        full_name: options?.data?.full_name,
      };
      writeMockUsers([...users, record]);

      const session = buildMockSession(record);
      persistSession(session);
      emitAuthEvent('SIGNED_IN', session);
      return {
        data: { user: session.user, session },
        error: null as AuthError | null,
      };
    },

    async signOut() {
      persistSession(null);
      emitAuthEvent('SIGNED_OUT', null);
      return { error: null as AuthError | null };
    },

    async resetPasswordForEmail(_email: string, _options?: { redirectTo?: string }) {
      return { data: {}, error: null as AuthError | null };
    },

    async updateUser({ password }: { password?: string }) {
      const current = loadSession();
      if (current && password) {
        const users = readMockUsers();
        const updated = users.map((u) =>
          u.email.toLowerCase() === (current.user.email || '').toLowerCase()
            ? { ...u, password }
            : u
        );
        writeMockUsers(updated);
      }
      const fallbackUser: User =
        current?.user ??
        buildMockSession({ id: `local-${Date.now()}`, email: 'analista@sapbasis.local', password: '' })
          .user;
      return {
        data: { user: fallbackUser },
        error: null as AuthError | null,
      };
    },
  };

  return { auth: mockAuth } as unknown as SupabaseClient;
}

let client: SupabaseClient;
if (isConfigured && rawUrl && rawAnonKey) {
  try {
    client = createClient(rawUrl, rawAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (e) {
    console.error('Erro ao inicializar cliente Supabase:', e);
    client = createMockSupabaseClient();
  }
} else {
  client = createMockSupabaseClient();
}

export const supabase = client;
