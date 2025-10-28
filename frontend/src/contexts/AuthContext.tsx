/**
 * Auth0 Authentication Context Provider
 * Manages authentication state using Auth0
 */

import { createContext, useContext, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  department?: string;
  clearanceLevel?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Development mode user (bypass Auth0 on HTTP)
const DEV_USER: User = {
  id: 'dev-user-1',
  email: 'dev@government.local',
  name: 'Development User',
  roles: ['admin', 'super_admin'],
  permissions: ['*'],
  department: 'IT',
  clearanceLevel: 5
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Check if we're in development mode (HTTP without Auth0)
  const isDevMode = typeof window !== 'undefined' && 
    window.location.protocol === 'http:' && 
    (!import.meta.env.VITE_AUTH0_DOMAIN || !import.meta.env.VITE_AUTH0_CLIENT_ID);

  // Use dev mode if HTTP without Auth0 credentials
  if (isDevMode) {
    const login = () => console.log('Dev mode: login bypassed');
    const logout = () => console.log('Dev mode: logout bypassed');
    const hasPermission = () => true;
    const hasRole = () => true;
    const getToken = async () => 'dev-token';

    return (
      <AuthContext.Provider value={{
        user: DEV_USER,
        isAuthenticated: true,
        isLoading: false,
        login,
        logout,
        hasPermission,
        hasRole,
        getToken
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // For production with Auth0, return a fallback that doesn't use hooks
  // Auth0Provider will wrap this component in main.tsx
  const fallbackContext: AuthContextType = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: () => console.log('No Auth0 setup'),
    logout: () => console.log('No Auth0 setup'),
    hasPermission: () => false,
    hasRole: () => false,
    getToken: async () => null
  };

  return (
    <AuthContext.Provider value={fallbackContext}>
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
