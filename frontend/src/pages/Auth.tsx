/**
 * Fixed Government Authentication with Working 2FA
 * Direct conditional rendering - no complex state
 */

import { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import MFAVerification from '../components/auth/MFAVerification';
import { useAuth } from '../contexts/AuthContext';

const Auth = () => {
  const { login, verifyMFA, isLoading } = useAuth();
  const [loginResult, setLoginResult] = useState<any>(null);
  const [authError, setAuthError] = useState<string>('');

  const handleLogin = async (credentials: { email: string; password: string }) => {
    console.log('🔐 Starting government authentication');
    setAuthError('');
    
    try {
      const result = await login(credentials);
      console.log('🔐 Login result:', result);
      
      if (result.success) {
        if (result.requiresMfa) {
          console.log('🛡️ MFA REQUIRED - Setting login result for MFA screen');
          setLoginResult(result); // Store entire result to trigger MFA screen
        } else {
          console.log('✅ Login successful, no MFA required');
          setLoginResult(null);
        }
      } else {
        console.log('❌ Login failed');
        setAuthError(result.error || 'Invalid government credentials');
        setLoginResult(null);
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      setAuthError('Authentication service error');
      setLoginResult(null);
    }
  };

  const handleMFAVerification = async (verificationResult: any) => {
    console.log('🛡️ MFA verification attempt');
    
    if (!loginResult || !loginResult.mfaToken) {
      setAuthError('MFA session expired. Please login again.');
      setLoginResult(null);
      return;
    }

    try {
      const result = await verifyMFA(loginResult.mfaToken, verificationResult.totpCode);
      
      if (result.success) {
        console.log('✅ MFA verification successful - access granted');
        setLoginResult(null); // Clear to prevent re-render
      } else {
        console.log('❌ MFA verification failed');
        setAuthError(result.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('❌ MFA verification error:', error);
      setAuthError('MFA verification failed');
    }
  };

  const handleBackToLogin = () => {
    console.log('🔙 Returning to login screen');
    setLoginResult(null);
    setAuthError('');
  };

  // Direct conditional rendering based on login result
  if (loginResult && loginResult.requiresMfa && loginResult.user) {
    console.log('🛡️ RENDERING: 2FA Verification Screen');
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'green',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 9999
        }}>
          ✅ 2FA VERIFICATION REQUIRED
        </div>
        
        <MFAVerification
          user={{
            id: loginResult.user.id,
            username: loginResult.user.username,
            fullName: loginResult.user.fullName,
            mfaEnabled: true,
            webauthnEnabled: false,
            totpEnabled: true
          }}
          mfaToken={loginResult.mfaToken}
          onVerificationSuccess={handleMFAVerification}
          onBack={handleBackToLogin}
          isLoading={isLoading}
          error={authError}
        />
      </div>
    );
  }

  // Render login screen
  console.log('🔐 RENDERING: Login Screen');
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'blue',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999
      }}>
        🔐 LOGIN | MFA Result: {loginResult ? 'YES' : 'NO'}
      </div>
      
      <LoginForm
        onLogin={handleLogin}
        isLoading={isLoading}
        error={authError}
      />
    </div>
  );
};

export default Auth;
