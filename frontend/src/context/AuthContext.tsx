import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { name: string; email: string; password: string; phone?: string; default_location?: string }) => Promise<User>;
  logout: () => Promise<void>;
  quickLogin: (role: 'admin' | 'officer_pwd' | 'officer_swm' | 'citizen') => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (api.getToken()) {
        const currentUser = await api.getMe();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
      api.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: { name: string; email: string; password: string; phone?: string; default_location?: string }): Promise<User> => {
    setLoading(true);
    try {
      const data = await api.register(payload);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.logout();
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const quickLogin = async (role: 'admin' | 'officer_pwd' | 'officer_swm' | 'citizen'): Promise<User> => {
    const creds = {
      admin: { email: 'admin@civiclens.gov', password: 'Admin@12345' },
      officer_pwd: { email: 'officer.pwd@civiclens.gov', password: 'Officer@12345' },
      officer_swm: { email: 'officer.swm@civiclens.gov', password: 'Officer@12345' },
      citizen: { email: 'citizen.aarav@example.com', password: 'Citizen@12345' },
    }[role];

    return login(creds.email, creds.password);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, quickLogin, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
