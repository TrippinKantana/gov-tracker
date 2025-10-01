import { useAuth0 } from '@auth0/auth0-react'

export interface User {
  id: string
  email: string
  name: string
  roles: string[]
  permissions: string[]
  department?: string
  clearanceLevel?: number
}

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0()

  const login = () => {
    loginWithRedirect()
  }

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    })
  }

  const getToken = async () => {
    if (!isAuthenticated) return null
    try {
      return await getAccessTokenSilently()
    } catch (error) {
      console.error('Error getting access token:', error)
      return null
    }
  }

  const transformUser = (auth0User: any): User | null => {
    if (!auth0User) return null
    
    return {
      id: auth0User.sub,
      email: auth0User.email,
      name: auth0User.name || auth0User.email,
      roles: auth0User['https://gov-tracker.com/roles'] || [],
      permissions: auth0User['https://gov-tracker.com/permissions'] || [],
      department: auth0User['https://gov-tracker.com/department'],
      clearanceLevel: auth0User['https://gov-tracker.com/clearance_level'] || 1
    }
  }

  return {
    user: transformUser(user),
    isAuthenticated,
    isLoading,
    login,
    logout: handleLogout,
    getToken
  }
}

export const AuthService = {
  useAuth
}

export default AuthService
