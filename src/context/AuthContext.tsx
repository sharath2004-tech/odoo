import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import { authAPI } from '../services/api';
import type { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string, role: UserRole) => Promise<void>;
  signup: (fullName: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (identifier: string, password: string, role: UserRole) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login(identifier, password, role);
      
      if (response.data.success) {
        const userData = response.data.data.user;
        const token = response.data.data.token;
        
        const newUser: User = {
          id: userData.id.toString(),
          fullName: userData.fullName,
          email: userData.email,
          role: userData.role,
        };
        
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('token', token);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (fullName: string, email: string, password: string, role: UserRole) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.register(fullName, email, password, role);
      
      if (response.data.success) {
        const userData = response.data.data.user;
        const token = response.data.data.token;
        
        const newUser: User = {
          id: userData.id.toString(),
          fullName: userData.fullName,
          email: userData.email,
          role: userData.role,
        };
        
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('token', token);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout, setUser, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
