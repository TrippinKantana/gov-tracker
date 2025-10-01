/**
 * Simple, Error-Free Login Component
 * No complex features - just basic authentication
 */

import { useState } from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

interface SimpleLoginProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

const SimpleLogin = ({ onLogin, isLoading, error }: SimpleLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    console.log('🔐 SIMPLE LOGIN: Login button clicked');
    
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    try {
      console.log('🔐 SIMPLE LOGIN: Calling onLogin with:', email);
      await onLogin({ email, password });
      console.log('🔐 SIMPLE LOGIN: Login completed');
    } catch (error) {
      console.error('🔐 SIMPLE LOGIN: Error:', error);
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <ShieldCheckIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Government Access
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            General Services Agencies - Republic of Liberia
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Simple Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Government Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your government email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading || !email || !password}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Authenticating...
              </div>
            ) : (
              <div className="flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                Secure Government Login
              </div>
            )}
          </button>
        </div>

        {/* GSA Admin Auto-fill */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setEmail('cyrus@wearelantern.net');
              setPassword('caTxLM9dtK');
            }}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Auto-fill GSA Admin credentials
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleLogin;
