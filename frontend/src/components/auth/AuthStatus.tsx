/**
 * Authentication Status Indicator
 * Shows current user and security status
 */

import { useState } from 'react';
import { UserCircleIcon, ShieldCheckIcon, KeyIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationDialog from '../ConfirmationDialog';

interface AuthStatusProps {
  className?: string;
}

const AuthStatus = ({ className = '' }: AuthStatusProps) => {
  const { user: currentUser, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  
  if (!currentUser) return null;

  const handleLogoutRequest = () => {
    setShowMenu(false);
    setShowLogoutConfirmation(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutConfirmation(false);
  };

  const formatLastLogin = (lastLogin: string) => {
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {currentUser.fullName.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium">{currentUser.fullName}</p>
          <div className="flex items-center space-x-1">
            <p className="text-xs text-gray-500">{currentUser.badgeNumber}</p>
            {currentUser.mfaEnabled && (
              <ShieldCheckIcon className="h-3 w-3 text-green-600" title="MFA Enabled" />
            )}
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
                  {currentUser.fullName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{currentUser.fullName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentUser.username} • {currentUser.badgeNumber}
                </p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
            </div>
            
            <div className="mt-3 flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-gray-600 dark:text-gray-400">Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <ShieldCheckIcon className="h-3 w-3 text-green-600" />
                <span className="text-gray-600 dark:text-gray-400">MFA Enabled</span>
              </div>
              <div className="flex items-center space-x-1">
                <KeyIcon className="h-3 w-3 text-blue-600" />
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  currentUser.clearanceLevel === 'top_secret' ? 'bg-red-100 text-red-800' :
                  currentUser.clearanceLevel === 'secret' ? 'bg-orange-100 text-orange-800' :
                  currentUser.clearanceLevel === 'confidential' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {currentUser.clearanceLevel.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="py-2">
            <button
              onClick={() => {
                window.location.href = '/personnel';
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <Cog6ToothIcon className="h-4 w-4" />
              <span>Personnel Management</span>
            </button>
            
            <button
              onClick={() => {
                window.location.href = '/account';
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <ShieldCheckIcon className="h-4 w-4" />
              <span>Account Settings</span>
            </button>
            
            <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
              <button
                onClick={handleLogoutRequest}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-b-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last login: {formatLastLogin(currentUser.lastLoginAt)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Department: {currentUser.department}
            </p>
          </div>
        </div>
      )}

      {/* Professional Logout Confirmation */}
      <ConfirmationDialog
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
        onConfirm={handleLogoutConfirm}
        title="Sign Out of Government System"
        message="Are you sure you want to sign out of your government account?"
        type="warning"
        details={[
          'You will need to log in again to access the system',
          'Any unsaved work may be lost',
          'Your session will be logged for security audit'
        ]}
        confirmText="Sign Out"
        cancelText="Stay Logged In"
        showCancel={true}
      />
    </div>
  );
};

export default AuthStatus;
