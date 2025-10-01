import React from 'react'
import { useAuth } from '../../contexts/AuthContext'

const LogoutButton: React.FC = () => {
  const { logout } = useAuth()

  return (
    <button
      onClick={logout}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 
                 transition-colors font-medium"
    >
      Log Out
    </button>
  )
}

export default LogoutButton
