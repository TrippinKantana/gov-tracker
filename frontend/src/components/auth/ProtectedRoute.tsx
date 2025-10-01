/**
 * Protected Route Component
 * Enforces authentication and RBAC
 */

import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Auth from '../../pages/Auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  requiredDepartment?: string;
  requireMFA?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requiredPermission, 
  requiredRole, 
  requiredDepartment,
  requireMFA = false 
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading, hasPermission, hasRole, hasDepartmentAccess } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Auth />;
  }

  // Check required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-100 rounded-full h-16 w-16 mx-auto flex items-center justify-center">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
            Access Denied
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You don't have permission to access this resource.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Required permission: <code className="bg-gray-100 px-2 py-1 rounded">{requiredPermission}</code>
          </p>
        </div>
      </div>
    );
  }

  // Check required role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full text-center">
          <div className="bg-orange-100 rounded-full h-16 w-16 mx-auto flex items-center justify-center">
            <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
            Role Required
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            This area requires a specific role.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Required role: <code className="bg-gray-100 px-2 py-1 rounded">{requiredRole}</code>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Your roles: <code className="bg-gray-100 px-2 py-1 rounded">{user.roles.join(', ')}</code>
          </p>
        </div>
      </div>
    );
  }

  // Check department access
  if (requiredDepartment && !hasDepartmentAccess(requiredDepartment)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full text-center">
          <div className="bg-purple-100 rounded-full h-16 w-16 mx-auto flex items-center justify-center">
            <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
            Department Access Required
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You can only access your assigned department.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Your department: <code className="bg-gray-100 px-2 py-1 rounded">{user.departmentId || 'None'}</code>
          </p>
        </div>
      </div>
    );
  }

  // Check MFA requirement for privileged operations
  if (requireMFA && user.roles.some(role => ['super_admin', 'org_admin', 'macs_head', 'auditor'].includes(role))) {
    // This would check for recent MFA verification
    // For now, we'll assume MFA is satisfied if user is logged in
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
