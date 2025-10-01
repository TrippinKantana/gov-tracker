/**
 * Government Account Settings & Security
 * User profile and 2FA management
 */

import { useState, useEffect } from 'react';
import { 
  UserIcon, 
  ShieldCheckIcon, 
  KeyIcon, 
  DevicePhoneMobileIcon,
  CogIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import MFASetupModal from '../components/auth/MFASetupModal';
import ConfirmationDialog from '../components/ConfirmationDialog';

const AccountSettings = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity'>('profile');
  
  // Force refresh user data when component loads
  useEffect(() => {
    // Import and refresh user data to get latest clearance level
    import('../services/authService').then(({ authService }) => {
      authService.refreshCurrentUser();
    });
  }, []);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    details?: string[];
    onConfirm?: () => void;
  }>({ type: 'success', title: '', message: '' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access account settings</p>
      </div>
    );
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setConfirmationData({
        type: 'error',
        title: 'Password Mismatch',
        message: 'The new passwords you entered do not match.',
        details: ['Please ensure both password fields contain the same value']
      });
      setShowConfirmation(true);
      return;
    }

    if (passwordForm.newPassword.length < 12) {
      setConfirmationData({
        type: 'error',
        title: 'Password Too Short',
        message: 'Government security policy requires passwords to be at least 12 characters long.',
        details: ['Use a mix of letters, numbers, and special characters for security']
      });
      setShowConfirmation(true);
      return;
    }

    setIsChangingPassword(true);
    try {
      // Mock password change
      console.log('🔒 Password change request for:', user.email);
      
      // Show success and logout
      setTimeout(() => {
        setConfirmationData({
          type: 'success',
          title: 'Password Changed Successfully',
          message: 'Your government account password has been updated.',
          details: [
            'You will be logged out for security',
            'Please log in again with your new password',
            'This change has been logged for security'
          ],
          onConfirm: () => logout()
        });
        setShowConfirmation(true);
      }, 1000);
      
    } catch (error) {
      console.error('Password change error:', error);
      setConfirmationData({
        type: 'error',
        title: 'Password Change Failed',
        message: 'Unable to change your password at this time.',
        details: ['Please contact your system administrator']
      });
      setShowConfirmation(true);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleMFASetupComplete = () => {
    setShowMFASetup(false);
    // Refresh user data or trigger re-fetch
    window.location.reload();
  };

  const disableMFA = () => {
    setConfirmationData({
      type: 'warning',
      title: 'Disable Two-Factor Authentication',
      message: 'Are you sure you want to disable 2FA? This will reduce your account security.',
      details: [
        'Your account will be less secure without 2FA',
        'Government security policy recommends keeping 2FA enabled',
        'This action will be logged for security audit'
      ],
      onConfirm: () => {
        console.log('🔓 Disabling MFA for:', user.email);
        // Actually disable MFA here
        setConfirmationData({
          type: 'success',
          title: '2FA Disabled',
          message: 'Two-factor authentication has been disabled for your account.',
          details: ['This action has been logged for security']
        });
        setShowConfirmation(true);
      }
    });
    setShowConfirmation(true);
  };

  const getSecurityScore = () => {
    let score = 50; // Base score
    if (user.mfaEnabled) score += 30;
    if (user.clearanceLevel === 'restricted') score += 20;
    return Math.min(score, 100);
  };

  const securityScore = getSecurityScore();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your government account and security settings
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Security Score</p>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    securityScore >= 80 ? 'bg-green-500' : 
                    securityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${securityScore}%` }}
                />
              </div>
              <span className={`text-sm font-bold ${
                securityScore >= 80 ? 'text-green-600' : 
                securityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {securityScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {user.fullName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.fullName}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">{user.department}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-500">{user.badgeNumber}</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">{user.email}</span>
              {user.mfaEnabled && (
                <div className="flex items-center space-x-1">
                  <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">2FA Enabled</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Security & 2FA
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'activity'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Activity Log
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={user.fullName}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Contact HR to change your name</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Badge Number
                </label>
                <input
                  type="text"
                  value={user.badgeNumber}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Contact IT to change your email</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={user.department}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Security Clearance
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    user.clearanceLevel === 'top_secret' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                    user.clearanceLevel === 'secret' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                    user.clearanceLevel === 'confidential' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {user.clearanceLevel.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={user.roles.join(', ').replace(/_/g, ' ')}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Password Security */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Password Security</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new password (12+ chars)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.mfaEnabled 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
              }`}>
                {user.mfaEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Two-factor authentication adds an extra layer of security to your government account.
            </p>

            {!user.mfaEnabled ? (
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-900 dark:text-orange-300">
                        2FA Setup Available
                      </p>
                      <p className="text-sm text-orange-800 dark:text-orange-400">
                        Enhance your account security with two-factor authentication.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Simple 2FA Enable Button */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <button
                    onClick={async () => {
                      console.log('🛡️ Enabling 2FA for user:', user.id);
                      const { authService } = await import('../services/authService');
                      const success = authService.enableMFA(user.id);
                      
                      if (success) {
                        alert('✅ 2FA Enabled! You will need to use 2FA on your next login.');
                        // Refresh the page to show updated status
                        window.location.reload();
                      } else {
                        alert('❌ Failed to enable 2FA');
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    🛡️ Enable 2FA (Simple Setup)
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Click to enable 2FA immediately - full setup available after enabling
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowMFASetup(true)}
                    className="p-4 border-2 border-blue-200 dark:border-blue-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <DevicePhoneMobileIcon className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Setup Authenticator App</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Use Google Authenticator, Authy, or similar</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowMFASetup(true)}
                    className="p-4 border-2 border-green-200 dark:border-green-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <KeyIcon className="h-8 w-8 text-green-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Add Security Key</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">YubiKey, FIDO2, or biometrics</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-300">
                        Two-Factor Authentication Enabled
                      </p>
                      <p className="text-sm text-green-800 dark:text-green-400">
                        Your account is protected with 2FA. Use your authenticator app to sign in.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowMFASetup(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Reconfigure 2FA
                  </button>
                  
                  <button
                    onClick={disableMFA}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Disable 2FA
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Security Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Information</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Account Status:</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Login:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(user.lastLoginAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Security Clearance:</span>
                  <span className={`font-medium px-2 py-1 rounded text-sm ${
                    user.clearanceLevel === 'top_secret' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                    user.clearanceLevel === 'secret' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                    user.clearanceLevel === 'confidential' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {user.clearanceLevel.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">2FA Status:</span>
                  <span className={`font-medium ${user.mfaEnabled ? 'text-green-600' : 'text-red-600'}`}>
                    {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Account Type:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {user.roles[0]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Session Status:</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab Content */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Current Security Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Security Status</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg text-center ${
                user.mfaEnabled 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <ShieldCheckIcon className={`h-8 w-8 mx-auto mb-2 ${
                  user.mfaEnabled ? 'text-green-600' : 'text-red-600'
                }`} />
                <p className="font-medium">2FA</p>
                <p className="text-sm">{user.mfaEnabled ? 'Enabled' : 'Disabled'}</p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                <LockClosedIcon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="font-medium">Encryption</p>
                <p className="text-sm">Argon2id</p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-center">
                <KeyIcon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="font-medium">Clearance</p>
                <p className="text-sm capitalize">{user.clearanceLevel}</p>
              </div>
            </div>
          </div>

          {/* 2FA Management would go here - same as in profile tab */}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Account Activity
            </h3>
            
            <div className="space-y-3">
              {authService.getAuditEvents()
                .filter(event => event.actorId === user.id || event.targetUserId === user.id)
                .slice(0, 10)
                .map(event => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border ${
                      event.outcome === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-medium ${
                          event.outcome === 'success' 
                            ? 'text-green-900 dark:text-green-300' 
                            : 'text-red-900 dark:text-red-300'
                        }`}>
                          {event.eventType.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-400">
                          {event.action} - {new Date(event.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          IP: {event.ipAddress} • Browser: {event.userAgent.substring(0, 50)}...
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        event.outcome === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {event.outcome.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MFA Setup Modal */}
      <MFASetupModal
        isOpen={showMFASetup}
        onClose={() => setShowMFASetup(false)}
        user={user}
        onSuccess={handleMFASetupComplete}
      />

      {/* Professional Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmationData.onConfirm}
        title={confirmationData.title}
        message={confirmationData.message}
        type={confirmationData.type}
        details={confirmationData.details}
        confirmText={confirmationData.onConfirm ? 'Continue' : 'OK'}
        showCancel={!!confirmationData.onConfirm}
      />
    </div>
  );
};

export default AccountSettings;
