/**
 * Role-Based Dashboard Router
 * Determines which dashboard to show based on user role
 */

import { useAuth } from '../contexts/AuthContext'
import Dashboard from '../pages/Dashboard' // Super Admin Dashboard
import DepartmentDashboard from '../pages/DepartmentDashboard'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const RoleBasedDashboard = () => {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Authentication Required</h3>
          <p className="mt-1 text-sm text-gray-500">Please log in to access the dashboard</p>
        </div>
      </div>
    )
  }

  // Check user roles to determine dashboard
  const isSuperAdmin = user.roles.includes('super_admin') || user.roles.includes('admin')
  const isITAdmin = user.roles.includes('it_admin') || user.roles.includes('system_admin')
  const isDepartmentAdmin = user.roles.includes('department_admin') || user.roles.includes('mac_admin')


  
  console.log('Full Auth0 User Object:', user)
  console.log('Raw roles array:', user.roles)
  console.log('User object keys:', Object.keys(user))
  
  // Check all possible role locations
  console.log('Checking role locations:', {
    'user.roles': user.roles,
    'user["https://gov-tracker.com/roles"]': (user as any)['https://gov-tracker.com/roles'],
    'user.app_metadata': (user as any).app_metadata,
    'user.user_metadata': (user as any).user_metadata
  })

  // IT Admin gets same privileges as Super Admin
  if (isSuperAdmin || isITAdmin) {
    console.log('Loading Super Admin/IT Dashboard for:', user.name)
    return <Dashboard />
  }

  // Department/MAC Admin gets scoped dashboard
  if (isDepartmentAdmin) {
    console.log('Loading Department Dashboard for:', user.name, 'Department:', user.department)
    return <DepartmentDashboard />
  }

  // Default: No recognized role
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-orange-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No Dashboard Access</h3>
        <p className="mt-1 text-sm text-gray-500">
          Your account doesn't have assigned roles for dashboard access.
        </p>
        <div className="mt-4 text-xs text-gray-400">
          <p>User: {user.email}</p>
          <p>Roles: {user.roles.length > 0 ? user.roles.join(', ') : 'None assigned'}</p>
          <p>Department: {user.department || 'Not assigned'}</p>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Contact your system administrator to assign appropriate roles.
        </p>
      </div>
    </div>
  )
}

export default RoleBasedDashboard
