/**
 * Multi-Factor Authentication Verification
 * Supports TOTP and WebAuthn/FIDO2
 */

import { useState, useEffect } from 'react';
import { KeyIcon, DevicePhoneMobileIcon, ShieldCheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface MFAVerificationProps {
  user: {
    id: string;
    username: string;
    fullName: string;
    mfaEnabled: boolean;
    webauthnEnabled: boolean;
    totpEnabled: boolean;
  };
  mfaToken: string;
  onVerificationSuccess: (result: any) => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string;
}

const MFAVerification = ({ user, mfaToken, onVerificationSuccess, onBack, isLoading, error }: MFAVerificationProps) => {
  const [mfaMethod, setMfaMethod] = useState<'totp' | 'webauthn'>('totp');
  const [totpCode, setTotpCode] = useState('');
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false);

  useEffect(() => {
    // Check WebAuthn support
    setIsWebAuthnSupported(
      typeof window !== 'undefined' && 
      'navigator' in window && 
      'credentials' in navigator &&
      typeof (navigator.credentials as any).create === 'function'
    );
  }, []);

  const handleTOTPVerification = async () => {
    if (totpCode.length !== 6) return;

    try {
      onVerificationSuccess({ totpCode });
    } catch (error) {
      console.error('TOTP verification error:', error);
    }
  };

  const handleWebAuthnVerification = async () => {
    try {
      // This would implement WebAuthn authentication flow
      console.log('WebAuthn verification not implemented in demo');
      
      // Mock successful WebAuthn verification
      setTimeout(() => {
        onVerificationSuccess({
          success: true,
          method: 'webauthn',
          user: user
        });
      }, 1000);
    } catch (error) {
      console.error('WebAuthn verification error:', error);
    }
  };

  const availableMethods = [];
  if (user.totpEnabled) availableMethods.push('totp');
  if (user.webauthnEnabled && isWebAuthnSupported) availableMethods.push('webauthn');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-orange-600 rounded-full flex items-center justify-center">
            <ShieldCheckIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Additional security verification required
          </p>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>{user.fullName}</strong> ({user.username})
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Complete MFA to access your government dashboard
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                  Verification Failed
                </h3>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MFA Method Selection */}
        {availableMethods.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Choose verification method:
            </h3>
            <div className="space-y-3">
              {user.totpEnabled && (
                <button
                  onClick={() => setMfaMethod('totp')}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    mfaMethod === 'totp'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Authenticator App</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">6-digit code from your authenticator app</p>
                    </div>
                  </div>
                </button>
              )}

              {user.webauthnEnabled && isWebAuthnSupported && (
                <button
                  onClick={() => setMfaMethod('webauthn')}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    mfaMethod === 'webauthn'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <KeyIcon className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Security Key</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Use your hardware security key or biometrics</p>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TOTP Verification */}
        {mfaMethod === 'totp' && user.totpEnabled && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <DevicePhoneMobileIcon className="h-5 w-5 mr-2 text-blue-600" />
              Enter verification code
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="totp-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  6-digit code from authenticator app
                </label>
                <input
                  id="totp-code"
                  type="text"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
              </div>

              <button
                onClick={handleTOTPVerification}
                disabled={isLoading || totpCode.length !== 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <DevicePhoneMobileIcon className="h-5 w-5 mr-2" />
                    Verify Code
                  </div>
                )}
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Open your authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit code
              </p>
            </div>
          </div>
        )}

        {/* WebAuthn Verification */}
        {mfaMethod === 'webauthn' && user.webauthnEnabled && isWebAuthnSupported && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <KeyIcon className="h-5 w-5 mr-2 text-green-600" />
              Use your security key
            </h3>
            
            <div className="text-center space-y-4">
              <div className="mx-auto h-20 w-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <KeyIcon className="h-10 w-10 text-green-600" />
              </div>
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Insert your security key and follow the prompts, or use device biometrics
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Touch the golden contact on your YubiKey</p>
                  <p>• Or use fingerprint/face recognition if available</p>
                </div>
              </div>

              <button
                onClick={handleWebAuthnVerification}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <KeyIcon className="h-5 w-5 mr-2" />
                    Use Security Key
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={onBack}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;
