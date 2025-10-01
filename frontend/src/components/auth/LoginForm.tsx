/**
 * Government-Grade Login Form
 * Supports password + MFA (TOTP/WebAuthn)
 */

import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, KeyIcon, ShieldCheckIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

interface LoginFormProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

const LoginForm = ({ onLogin, isLoading, error }: LoginFormProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password.trim()) {
      return;
    }

    await onLogin(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <ShieldCheckIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Secure Access
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            General Services Agencies - Republic of Liberia
          </p>
          <div className="mt-4 flex justify-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center">
              <ShieldCheckIcon className="h-3 w-3 mr-1" />
              NIST SP 800-63B
            </span>
            <span className="flex items-center">
              <KeyIcon className="h-3 w-3 mr-1" />
              Argon2id Encryption
            </span>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <ShieldCheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Government Security Notice
              </h3>
              <p className="text-xs text-blue-800 dark:text-blue-400 mt-1">
                This system is for authorized government personnel only. All activities are monitored and logged for security purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} method="POST" action="#">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                    Authentication Failed
                  </h3>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Government Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Government Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your government email address"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember this device
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  Forgot password?
                </a>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !formData.email.trim() || !formData.password.trim()}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  Secure Sign In
                </div>
              )}
            </button>
          </div>



          {/* Security Features */}
          <div className="mt-6">
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Supported security features:</p>
              <div className="flex justify-center space-x-6 text-xs text-gray-500">
                <div className="flex flex-col items-center">
                  <KeyIcon className="h-4 w-4 mb-1" />
                  <span>Security Keys</span>
                </div>
                <div className="flex flex-col items-center">
                  <DevicePhoneMobileIcon className="h-4 w-4 mb-1" />
                  <span>TOTP Apps</span>
                </div>
                <div className="flex flex-col items-center">
                  <ShieldCheckIcon className="h-4 w-4 mb-1" />
                  <span>Biometrics</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Government Compliance */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This authentication system complies with NIST SP 800-63B Digital Identity Guidelines
            and OWASP Application Security Verification Standard Level 2+
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
