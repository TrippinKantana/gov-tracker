/**
 * Auth0 Account Settings
 * User profile management with Auth0
 */

import { useState } from 'react'
import { 
  UserIcon, 
  ShieldCheckIcon, 
  KeyIcon, 
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

const AccountSettings = () => {
  const { user, logout, getToken } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity'>('profile')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Not authenticated</h3>
          <p className="mt-1 text-sm text-gray-500">Please log in to access account settings</p>
        </div>
      </div>
    )
  }



  const ProfileTab = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="ml-5 flex-1">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {user.name || user.email}
              </h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              {user.department && (
                <p className="text-sm text-gray-500">{user.department}</p>
              )}
              <div className="mt-2 flex items-center space-x-2">
                <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Auth0 Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">User Information</h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{user.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.name || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Department</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.department || 'Not assigned'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Clearance Level</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.clearanceLevel ? `Level ${user.clearanceLevel}` : 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Roles</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.roles.length > 0 ? user.roles.join(', ') : 'No roles assigned'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )

  const SecurityTab = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Authentication</h3>
              <p className="mt-1 text-sm text-gray-500">Your account is secured with Auth0</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
          
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="border rounded-lg p-4">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                <span className="ml-2 text-sm font-medium text-gray-900">Single Sign-On</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Managed by Auth0</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center">
                <KeyIcon className="h-6 w-6 text-blue-600" />
                <span className="ml-2 text-sm font-medium text-gray-900">Access Token</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">JWT-based authentication</p>
            </div>
          </div>

        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Permissions</h3>
          {user.permissions.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {user.permissions.map((permission, index) => (
                <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700">{permission}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No specific permissions assigned</p>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Sign Out</h3>
              <p className="mt-1 text-sm text-gray-500">Sign out of your account</p>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const ActivityTab = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Logged in via Auth0</p>
                <p className="text-xs text-gray-500">Current session</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-gray-600">Manage your Auth0 account and security settings</p>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`mb-6 rounded-md p-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <div className="flex">
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 mr-2" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'profile', name: 'Profile', icon: UserIcon },
              { id: 'security', name: 'Security', icon: ShieldCheckIcon },
              { id: 'activity', name: 'Activity', icon: DevicePhoneMobileIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="mr-2 h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'activity' && <ActivityTab />}
        </div>
      </div>
    </div>
  )
}

export default AccountSettings
