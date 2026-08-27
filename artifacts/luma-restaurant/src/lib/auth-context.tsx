import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiRequest } from '@/lib/api';

export type User = { id: number; name: string; email: string; role: string };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!window.localStorage.getItem('luma_token')) {
      setLoading(false);
      return;
    }
    apiRequest<User>('/auth/me')
      .then(setUser)
      .catch(() => window.localStorage.removeItem('luma_token'))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: (nextUser, token) => {
      window.localStorage.setItem('luma_token', token);
      setUser(nextUser);
    },
    logout: () => {
      window.localStorage.removeItem('luma_token');
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
