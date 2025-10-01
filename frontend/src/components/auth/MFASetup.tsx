/**
 * Multi-Factor Authentication Setup
 * WebAuthn/FIDO2 + TOTP enrollment
 */

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { startRegistration } from '@simplewebauthn/browser';
import { 
  ShieldCheckIcon, 
  KeyIcon, 
  DevicePhoneMobileIcon, 
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface MFASetupProps {
  user: any;
  onMFAEnabled: (method: 'webauthn' | 'totp') => void;
  onSkip?: () => void;
}

const MFASetup = ({ user, onMFAEnabled, onSkip }: MFASetupProps) => {
  const [activeMethod, setActiveMethod] = useState<'webauthn' | 'totp' | null>(null);
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [totpQRCode, setTotpQRCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpVerificationCode, setTotpVerificationCode] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [step, setStep] = useState<'choose' | 'setup' | 'verify' | 'backup' | 'complete'>('choose');
  const [error, setError] = useState<string>('');

  const handleWebAuthnSetup = async () => {
    setIsEnrolling(true);
    setError('');
    setActiveMethod('webauthn');
    setStep('setup');

    try {
      // Get registration options from server
      const optionsResponse = await fetch('/api/auth/webauthn/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const optionsResult = await optionsResponse.json();
      
      if (!optionsResult.success) {
        throw new Error(optionsResult.error);
      }

      // Start WebAuthn registration
      const credential = await startRegistration(optionsResult.options);

      // Verify registration with server
      const verifyResponse = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          credential 
        })
      });

      const verifyResult = await verifyResponse.json();

      if (verifyResult.success) {
        setStep('complete');
        setTimeout(() => onMFAEnabled('webauthn'), 2000);
      } else {
        throw new Error(verifyResult.error);
      }

    } catch (error: any) {
      console.error('WebAuthn setup error:', error);
      setError(error.message || 'WebAuthn setup failed. Please try again.');
      setStep('choose');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleTOTPSetup = async () => {
    setIsEnrolling(true);
    setError('');
    setActiveMethod('totp');
    setStep('setup');

    try {
      // Enroll TOTP with server
      const response = await fetch('/api/auth/totp/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const result = await response.json();

      if (result.success) {
        setTotpSecret(result.secret);
        setTotpQRCode(result.qrCode);
        setBackupCodes(result.backupCodes);
        setStep('verify');
      } else {
        throw new Error(result.error);
      }

    } catch (error: any) {
      console.error('TOTP setup error:', error);
      setError(error.message || 'TOTP setup failed. Please try again.');
      setStep('choose');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleTOTPVerification = async () => {
    if (totpVerificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsEnrolling(true);
    setError('');

    try {
      const response = await fetch('/api/auth/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          token: totpVerificationCode 
        })
      });

      const result = await response.json();

      if (result.success) {
        setStep('backup');
      } else {
        setError('Invalid verification code. Please try again.');
      }

    } catch (error: any) {
      console.error('TOTP verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleBackupCodesConfirmed = () => {
    setStep('complete');
    setTimeout(() => onMFAEnabled('totp'), 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 rounded-lg p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <ShieldCheckIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Setup Multi-Factor Authentication</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enhanced security for {user.fullName}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          {/* Step: Choose Method */}
          {step === 'choose' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
                Choose Security Method
              </h2>

              {/* WebAuthn Option (Recommended) */}
              <div className="border-2 border-green-200 dark:border-green-800 rounded-lg p-6 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-start space-x-4">
                  <KeyIcon className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Security Key (Recommended)</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Use a FIDO2 security key (YubiKey, etc.) or built-in biometrics. 
                      Most secure and phishing-resistant.
                    </p>
                    <button
                      onClick={handleWebAuthnSetup}
                      disabled={isEnrolling}
                      className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Setup Security Key
                    </button>
                  </div>
                </div>
              </div>

              {/* TOTP Option */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <DevicePhoneMobileIcon className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Authenticator App</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Use Google Authenticator, Authy, or similar app to generate codes.
                    </p>
                    <button
                      onClick={handleTOTPSetup}
                      disabled={isEnrolling}
                      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Setup Authenticator App
                    </button>
                  </div>
                </div>
              </div>

              {/* Skip Option (if allowed) */}
              {onSkip && (
                <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={onSkip}
                    className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Skip for now (not recommended)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step: WebAuthn Setup */}
          {step === 'setup' && activeMethod === 'webauthn' && (
            <div className="text-center space-y-6">
              <KeyIcon className="h-16 w-16 text-blue-600 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Insert Your Security Key
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Follow your browser's prompts to register your security key or use built-in biometrics.
              </p>
              {isEnrolling && (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600 dark:text-gray-400">Waiting for security key...</span>
                </div>
              )}
            </div>
          )}

          {/* Step: TOTP QR Code */}
          {step === 'setup' && activeMethod === 'totp' && (
            <div className="space-y-6">
              <div className="text-center">
                <DevicePhoneMobileIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Scan QR Code
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Open your authenticator app and scan this QR code
                </p>
              </div>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg mx-auto w-fit">
                {totpQRCode && <QRCodeSVG value={totpQRCode} size={200} />}
              </div>

              {/* Manual entry option */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Can't scan QR code?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Enter this code manually:
                </p>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded font-mono text-sm">
                    {totpSecret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(totpSecret)}
                    className="p-1 text-blue-600 hover:text-blue-700"
                    title="Copy to clipboard"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setStep('verify')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                I've Added the Code
              </button>
            </div>
          )}

          {/* Step: TOTP Verification */}
          {step === 'verify' && activeMethod === 'totp' && (
            <div className="space-y-6">
              <div className="text-center">
                <DevicePhoneMobileIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Verify Setup
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={totpVerificationCode}
                  onChange={(e) => setTotpVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>

              <button
                onClick={handleTOTPVerification}
                disabled={totpVerificationCode.length !== 6 || isEnrolling}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isEnrolling ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                onClick={() => setStep('setup')}
                className="w-full text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Back to QR Code
              </button>
            </div>
          )}

          {/* Step: Backup Codes */}
          {step === 'backup' && (
            <div className="space-y-6">
              <div className="text-center">
                <ExclamationTriangleIcon className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Save Backup Codes
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Store these codes securely. Use them if you lose access to your authenticator.
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-white dark:bg-gray-700 p-3 rounded font-mono text-center text-sm">
                      {code}
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  className="w-full mt-4 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                  <span>Copy All Codes</span>
                </button>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">Important Security Notice</h4>
                <ul className="text-sm text-red-800 dark:text-red-400 space-y-1">
                  <li>• Each backup code can only be used once</li>
                  <li>• Store codes in a secure location (password manager, safe, etc.)</li>
                  <li>• Do not share these codes with anyone</li>
                  <li>• Generate new codes if you suspect compromise</li>
                </ul>
              </div>

              <button
                onClick={handleBackupCodesConfirmed}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                I've Saved the Backup Codes
              </button>
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="text-center space-y-6">
              <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                MFA Setup Complete!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your account is now secured with {activeMethod === 'webauthn' ? 'WebAuthn security key' : 'TOTP authenticator'}.
              </p>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-400">
                  You'll be asked for your second factor when signing in on new devices or performing sensitive operations.
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Security Features Info */}
          {step === 'choose' && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Why is MFA required?
              </h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Government security compliance (NIST SP 800-63B)</li>
                <li>• Protection against unauthorized access</li>
                <li>• Required for privileged government accounts</li>
                <li>• Prevents account takeover attacks</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MFASetup;
