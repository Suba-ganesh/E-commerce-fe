import React, { createContext, useContext, useState, useEffect } from 'react';
import { initMockDb } from '../utils/mockDb';

interface User {
  id: string;
  name: string;
  email: string;
  role: string; // admin, customer
  status?: string;
  createdAt?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_image?: string;
  wholesale_discount?: number;
  wholesale_tier?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  loginWithSocial: (provider: 'google' | 'facebook' | 'apple', token: string, extraData?: any) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string; errors?: { field: string; message: string }[] }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialise mock database
    initMockDb();

    // Check if session exists in localStorage and token is present
    const storedSession = localStorage.getItem('Session');
    const token = localStorage.getItem('chennis_auth_token');
    
    if (storedSession && token) {
      try {
        const session = JSON.parse(storedSession);
        if (session.isLoggedIn && session.currentUser) {
          setUser(session.currentUser);
        }
      } catch (e) {
        console.error('Failed to load session', e);
        localStorage.removeItem('Session');
        localStorage.removeItem('chennis_auth_token');
      }
    } else {
      // Clean up orphaned session or token
      if (storedSession) localStorage.removeItem('Session');
      if (token) localStorage.removeItem('chennis_auth_token');
    }
    setIsLoading(false);

    const handleUnauthorized = () => {
      logout();
    };
    const handleSync = () => {
      const storedSession = localStorage.getItem('Session');
      if (storedSession) {
        try {
          const session = JSON.parse(storedSession);
          if (session.isLoggedIn && session.currentUser) {
            setUser(session.currentUser);
          }
        } catch (e) {
          console.error('Failed to sync session', e);
        }
      }
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:sync', handleSync);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:sync', handleSync);
    };
  }, []);



  const login = async (email: string, pass: string) => {
    try {
      const { authService } = await import('../services/authService');
      const response = await authService.login({ email, password: pass });
      
      const sessionUser = {
        id: response.data.user.id,
        name: `${response.data.user.first_name} ${response.data.user.last_name}`.trim(),
        email: response.data.user.email,
        role: typeof response.data.user.role === 'object' ? response.data.user.role.name.toLowerCase() : response.data.user.role.toLowerCase(),
        status: response.data.user.status,
        createdAt: response.data.user.created_at,
        first_name: response.data.user.first_name,
        last_name: response.data.user.last_name,
        phone_number: response.data.user.phone_number,
        profile_image: response.data.user.profile_image,
        wholesale_discount: response.data.user.wholesale_discount,
        wholesale_tier: response.data.user.wholesale_tier,
      };

      localStorage.setItem('chennis_auth_token', response.data.accessToken);
      localStorage.setItem('Session', JSON.stringify({ isLoggedIn: true, currentUser: sessionUser, sessionStart: new Date().toISOString() }));
      setUser(sessionUser);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, message: 'Invalid email or password. Please check your credentials and try again.' };
    }
  };

  const register = async (data: any) => {
    try {
      const { authService } = await import('../services/authService');
      await authService.signup(data);
      // Registration successful, return success so the view can redirect to login
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        message: 'Registration failed. Please check your details and try again.',
        errors: error.data?.errors
      };
    }
  };

  const loginWithSocial = async (provider: 'google' | 'facebook' | 'apple', token: string, extraData?: any) => {
    try {
      const { authService } = await import('../services/authService');
      let response;
      if (provider === 'google') {
        response = await authService.loginWithGoogle(token);
      } else if (provider === 'facebook') {
        response = await authService.loginWithFacebook(token);
      } else {
        response = await authService.loginWithApple(token, extraData);
      }
      
      const sessionUser = {
        id: response.data.user.id,
        name: `${response.data.user.first_name} ${response.data.user.last_name}`.trim(),
        email: response.data.user.email,
        role: typeof response.data.user.role === 'object' ? response.data.user.role.name.toLowerCase() : response.data.user.role.toLowerCase(),
        status: response.data.user.status,
        createdAt: response.data.user.created_at,
        first_name: response.data.user.first_name,
        last_name: response.data.user.last_name,
        phone_number: response.data.user.phone_number,
        profile_image: response.data.user.profile_image,
        wholesale_discount: response.data.user.wholesale_discount,
        wholesale_tier: response.data.user.wholesale_tier,
      };

      localStorage.setItem('chennis_auth_token', response.data.accessToken);
      localStorage.setItem('Session', JSON.stringify({ isLoggedIn: true, currentUser: sessionUser, sessionStart: new Date().toISOString() }));
      setUser(sessionUser);
      
      return { success: true };
    } catch (error: any) {
      console.error(`${provider} auth failed`, error);
      return { success: false, message: error.message || `Failed to authenticate using ${provider}.` };
    }
  };

  const logout = () => {
    localStorage.removeItem('chennis_auth_token');
    localStorage.setItem('Session', JSON.stringify({ isLoggedIn: false, currentUser: null, sessionStart: null }));
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithSocial,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
