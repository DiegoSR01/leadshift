import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, saveToken, clearToken, isAuthenticated } from '../lib/api';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    try {
      const u = await api.auth.me();
      setUser(u);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const { user: u, token } = await api.auth.login(email, password);
    saveToken(token);
    setUser(u);
  };

  const register = async (data: any) => {
    const { user: u, token } = await api.auth.register(data);
    saveToken(token);
    setUser(u);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const refreshUser = async () => {
    const u = await api.auth.me();
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
