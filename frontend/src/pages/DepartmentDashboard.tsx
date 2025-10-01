/**
 * Department/MAC Admin Dashboard
 * Scoped view for department administrators
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  BuildingOfficeIcon,
  TruckIcon,
  ComputerDesktopIcon,
  UsersIcon,
  ChartBarIcon,
  MapPinIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface DepartmentStats {
  totalAssets: number
  vehicles: number
  equipment: number
  facilities: number
  personnel: number
  maintenanceAlerts: number
  departmentName: string
}

const DepartmentDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DepartmentStats>({
    totalAssets: 0,
    vehicles: 0,
    equipment: 0,
    facilities: 0,
    personnel: 0,
    maintenanceAlerts: 0,
    departmentName: user?.department || 'Unknown Department'
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is assigned to a MAC by super admin
    const fetchDepartmentData = async () => {
      setIsLoading(true)
      
      // Check if user has a department/MAC assigned
      if (!user?.department || user.department === 'Not assigned') {
        // No MAC assigned - show empty state
        setStats({
          totalAssets: 0,
          vehicles: 0,
          equipment: 0,
          facilities: 0,
          personnel: 0,
          maintenanceAlerts: 0,
          departmentName: 'No MAC Assigned'
        })
        setIsLoading(false)
        return
      }

      // TODO: Replace with real API call to fetch MAC-specific data
      // For now, we'll show zeros until super admin assigns real data
      const realStats: DepartmentStats = {
        totalAssets: 0,
        vehicles: 0,
        equipment: 0,
        facilities: 0,
        personnel: 0,
        maintenanceAlerts: 0,
        departmentName: user.department
      }
      
      setTimeout(() => {
        setStats(realStats)
        setIsLoading(false)
      }, 500)
    }

    fetchDepartmentData()
  }, [user?.department])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">Please log in to access the dashboard</p>
        </div>
      </div>
    )
  }

  // Check if user has department admin role
  const isDepartmentAdmin = user.roles.includes('department_admin') || 
                           user.roles.includes('mac_admin')
  
  if (!isDepartmentAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Insufficient Permissions</h3>
          <p className="mt-1 text-sm text-gray-500">You need department administrator privileges to access this dashboard</p>
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, icon: Icon, color }: {
    title: string
    value: number | string
    icon: any
    color: string
  }) => (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-white">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {stats.departmentName} Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user.name}. 
            {!user?.department || user.department === 'Not assigned' 
              ? ' You need to be assigned to a MAC by a Super Admin.' 
              : " Here's your department overview."}
          </p>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span>
              {!user?.department || user.department === 'Not assigned' 
                ? 'No MAC Assignment' 
                : `Department Scope: ${stats.departmentName}`}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 bg-gray-300 rounded"></div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !user?.department || user.department === 'Not assigned' ? (
          /* No MAC Assignment State */
          <div className="text-center py-16">
            <ExclamationTriangleIcon className="mx-auto h-24 w-24 text-yellow-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No MAC Assignment</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              You need to be assigned to a Ministry, Agency, or Commission (MAC) by a Super Administrator 
              before you can access department assets, vehicles, and facilities.
            </p>
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-yellow-800">
                <strong>Contact your Super Admin</strong> to get assigned to your MAC.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard
                title="Total Assets"
                value={stats.totalAssets}
                icon={ChartBarIcon}
                color="text-blue-600"
              />
              <StatCard
                title="Vehicles"
                value={stats.vehicles}
                icon={TruckIcon}
                color="text-green-600"
              />
              <StatCard
                title="Equipment"
                value={stats.equipment}
                icon={ComputerDesktopIcon}
                color="text-purple-600"
              />
              <StatCard
                title="Facilities"
                value={stats.facilities}
                icon={BuildingOfficeIcon}
                color="text-orange-600"
              />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-8">
              <StatCard
                title="Department Personnel"
                value={stats.personnel}
                icon={UsersIcon}
                color="text-indigo-600"
              />
              <StatCard
                title="Maintenance Alerts"
                value={stats.maintenanceAlerts}
                icon={ExclamationTriangleIcon}
                color={stats.maintenanceAlerts > 0 ? "text-red-600" : "text-green-600"}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button
                  onClick={() => window.location.href = '/map'}
                  className="flex items-center px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  View Department Map
                </button>
                
                <button
                  onClick={() => window.location.href = '/vehicles'}
                  className="flex items-center px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                >
                  <TruckIcon className="h-5 w-5 mr-2" />
                  Manage Vehicles
                </button>
                
                <button
                  onClick={() => window.location.href = '/equipments'}
                  className="flex items-center px-4 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                >
                  <ComputerDesktopIcon className="h-5 w-5 mr-2" />
                  View Equipment
                </button>
              </div>
            </div>

            {/* Department Info */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Department Information</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Administrator</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{stats.departmentName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Access Level</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user.clearanceLevel ? `Level ${user.clearanceLevel}` : 'Standard'}
                  </dd>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DepartmentDashboard
