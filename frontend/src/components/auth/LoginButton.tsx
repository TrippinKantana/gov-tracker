import React from 'react'
import { useAuth } from '../../contexts/AuthContext'

const LoginButton: React.FC = () => {
  const { login, isLoading } = useAuth()

  return (
    <button
      onClick={login}
      disabled={isLoading}
      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                 font-semibold text-lg"
    >
      {isLoading ? 'Loading...' : 'Log In'}
    </button>
  )
}

export default LoginButton
