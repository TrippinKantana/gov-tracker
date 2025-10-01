/**
 * Protected Route Component
 * Restricts access based on user roles
 */

import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isDepartmentAdmin, isSuperOrITAdmin } from '../utils/departmentFilter';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ProtectedRouteProps {
  children: ReactNode;
  requireSuperAdmin?: boolean;
  blockDepartmentAdmin?: boolean;
  customMessage?: string;
}

const ProtectedRoute = ({ 
  children, 
  requireSuperAdmin = false, 
  blockDepartmentAdmin = false,
  customMessage 
}: ProtectedRouteProps) => {
  const { user } = useAuth();

  // Block department admins if specified
  if (blockDepartmentAdmin && isDepartmentAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto">
          <ExclamationTriangleIcon className="mx-auto h-24 w-24 text-red-400" />
          <h3 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">Access Restricted</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {customMessage || 'MAC administrators do not have access to this page. This is restricted to Super Administrators only.'}
          </p>
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-300">
              <strong>Your Role:</strong> {user?.department || 'MAC'} Administrator<br/>
              <strong>Access Level:</strong> Department-specific resources only
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Require super admin access
  if (requireSuperAdmin && !isSuperOrITAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto">
          <ExclamationTriangleIcon className="mx-auto h-24 w-24 text-orange-400" />
          <h3 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">Super Admin Required</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            This page requires Super Administrator privileges to access.
          </p>
          <div className="mt-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="text-sm text-orange-800 dark:text-orange-300">
              <strong>Your Role:</strong> {user?.roles.join(', ')}<br/>
              <strong>Required:</strong> Super Administrator
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
