import React, { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

const AuthDebug: React.FC = () => {
  const { isLoading, error, isAuthenticated, user, getAccessTokenSilently } = useAuth0()

  useEffect(() => {
    console.log('Auth0 State Changed:', { isLoading, isAuthenticated, user: user?.email, error })
    if (error) {
      console.error('Auth0 Error Details:', error)
    }
  }, [isLoading, isAuthenticated, user, error])

  const testToken = async () => {
    if (isAuthenticated) {
      try {
        const token = await getAccessTokenSilently()
        console.log('Access Token:', token?.substring(0, 50) + '...')
      } catch (err) {
        console.error('Token Error:', err)
      }
    }
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg text-xs">
      <h3 className="font-bold mb-2">Auth0 Debug Info:</h3>
      <p>Domain: {import.meta.env.VITE_AUTH0_DOMAIN}</p>
      <p>Client ID: {import.meta.env.VITE_AUTH0_CLIENT_ID}</p>
      <p>Redirect URI: {import.meta.env.VITE_AUTH0_REDIRECT_URI}</p>
      <p>Audience: {import.meta.env.VITE_AUTH0_AUDIENCE}</p>
      <p>Loading: {isLoading.toString()}</p>
      <p>Authenticated: {isAuthenticated.toString()}</p>
      <p>Error: {error ? error.message : 'None'}</p>
      <p>User: {user ? user.email : 'None'}</p>
      <p>URL: {window.location.href}</p>
      {isAuthenticated && (
        <button 
          onClick={testToken}
          className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Test Token
        </button>
      )}
    </div>
  )
}

export default AuthDebug
