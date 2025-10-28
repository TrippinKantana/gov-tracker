/**
 * Auth0 Authentication Context Provider
 * Manages authentication state using Auth0
 */

import { createContext, useContext, ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { 
    user: auth0User, 
    isAuthenticated, 
    isLoading, 
    loginWithRedirect, 
    logout: auth0Logout,
    getAccessTokenSilently 
  } = useAuth0();

  const transformUser = (auth0User: any): User | null => {
    if (!auth0User) return null;
    
    // Check multiple possible locations for roles
    let roles = auth0User['https://gov-tracker.com/roles'] || 
                auth0User.roles || 
                auth0User.app_metadata?.roles || 
                auth0User.user_metadata?.roles || 
                [];
    

    

    
    return {
      id: auth0User.sub,
      email: auth0User.email,
      name: auth0User.name || auth0User.email,
      roles: roles,
      permissions: auth0User['https://gov-tracker.com/permissions'] || 
                   auth0User.permissions || 
                   auth0User.app_metadata?.permissions || 
                   [],
      department: auth0User['https://gov-tracker.com/department'] || 
                  auth0User.user_metadata?.department,
      clearanceLevel: auth0User['https://gov-tracker.com/clearance_level'] || 
                      auth0User.user_metadata?.clearance_level || 1
    };
  };

  const user = transformUser(auth0User);

  const login = () => {
    loginWithRedirect();
  };

  const logout = () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };

  const getToken = async (): Promise<string | null> => {
    if (!isAuthenticated) return null;
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasPermission,
    hasRole,
    getToken
  };

  return (
    <AuthContext.Provider value={contextValue}>
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
