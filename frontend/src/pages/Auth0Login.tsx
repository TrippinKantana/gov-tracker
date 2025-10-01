import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoginButton from '../components/auth/LoginButton'
import LogoutButton from '../components/auth/LogoutButton'
import Profile from '../components/auth/Profile'
import AuthDebug from '../components/auth/AuthDebug'

const Auth0Login: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center relative overflow-hidden py-12">
        {/* Background Pattern - Simplified */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-y-12"></div>
        </div>
        
        {/* Security Badge */}
        <div className="absolute top-8 left-8 flex items-center space-x-2 text-white/80">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">SECURE CONNECTION</span>
        </div>

        {/* Main Login Container */}
        <div className="relative z-10 w-full max-w-md">
          {/* Government Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              GENERAL SERVICES AGENCY
            </h1>
            <p className="text-xl font-semibold text-blue-200 mb-1">
              Government of Liberia
            </p>
            <p className="text-sm text-white/80 mb-6">
              Asset Tracking & Management System
            </p>
            
            <div className="flex items-center justify-center space-x-4 text-xs text-white/60">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>SSL ENCRYPTED</span>
              </div>
              <div className="w-px h-4 bg-white/20"></div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>GOVERNMENT AUTHORIZED</span>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
            {/* Login Section */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Secure Portal Access
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Use your government credentials to access the asset management system
              </p>
              
              {/* Auth0 Login Button */}
              <div className="mb-6">
                <LoginButton />
              </div>

              {/* Security Features */}
              <div className="space-y-3 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>Two-Factor Authentication</span>
                  <span className="text-green-600 font-medium">ENABLED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Session Encryption</span>
                  <span className="text-green-600 font-medium">AES-256</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Audit Logging</span>
                  <span className="text-green-600 font-medium">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Information */}
          <div className="mt-8 text-center text-xs text-white/60">
            <p className="mb-2">
              Protected by government-grade security protocols
            </p>
            <p>
              General Services Agency • Information Technology Division
            </p>
            <p className="mt-2">
              © {new Date().getFullYear()} Government of Liberia - All rights reserved
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full translate-x-32 translate-y-32 blur-3xl"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.name}
          </h1>
          <div className="mt-4">
            <LogoutButton />
          </div>
        </div>
        <Profile />
      </div>
    </div>
  )
}

export default Auth0Login
