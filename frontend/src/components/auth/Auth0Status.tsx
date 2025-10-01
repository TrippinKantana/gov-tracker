/**
 * Auth0 User Status Component
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

interface AuthStatusProps {
  className?: string
}

const AuthStatus = ({ className = '' }: AuthStatusProps) => {
  const { user: currentUser, logout } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()
  
  if (!currentUser) return null

  const getInitials = () => {
    if (currentUser.name) {
      return currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return currentUser.email?.[0]?.toUpperCase() || 'U'
  }

  const getDisplayName = () => {
    return currentUser.name || currentUser.email
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {getInitials()}
          </span>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium">{getDisplayName()}</p>
          <div className="flex items-center space-x-1">
            <p className="text-xs text-gray-500">{currentUser.department || 'Government User'}</p>
            <ShieldCheckIcon className="h-3 w-3 text-green-600" title="Auth0 Secured" />
          </div>
        </div>
      </button>

      {/* User Menu */}
      {showMenu && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {getInitials()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{getDisplayName()}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
                {currentUser.department && (
                  <p className="text-xs text-gray-500">{currentUser.department}</p>
                )}
              </div>
            </div>
            
            <div className="mt-3 flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-gray-600 dark:text-gray-400">Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <ShieldCheckIcon className="h-3 w-3 text-green-600" />
                <span className="text-gray-600 dark:text-gray-400">Auth0 Secured</span>
              </div>
              {currentUser.clearanceLevel && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs px-2 py-1 rounded font-medium bg-blue-100 text-blue-800">
                    Level {currentUser.clearanceLevel}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="py-2">
            <button
              onClick={() => {
                navigate('/account')
                setShowMenu(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <ShieldCheckIcon className="h-4 w-4" />
              <span>Account Settings</span>
            </button>
            
            <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
              <button
                onClick={() => {
                  logout()
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-b-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Department: {currentUser.department || 'Government'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              User ID: {currentUser.id}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthStatus
