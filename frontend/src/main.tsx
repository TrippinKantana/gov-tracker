import React from 'react'
import ReactDOM from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import App from './App.tsx'
import './index.css'

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin

// Check if we're on HTTP without Auth0 credentials (development mode)
const isHttp = window.location.protocol === 'http:'
const hasAuth0Creds = domain && clientId

// Skip Auth0 only if on HTTP AND no credentials provided
const shouldSkipAuth0 = isHttp && !hasAuth0Creds

// Override window location to HTTPS if we're on HTTP with Auth0
if (isHttp && hasAuth0Creds) {
  console.warn('Auth0 requires HTTPS. Please use a secure connection or provide a domain with SSL.')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {shouldSkipAuth0 ? (
      // HTTP development mode without Auth0
      <App />
    ) : (
      // HTTPS or Auth0 credentials provided
      <Auth0Provider 
        domain={domain!}
        clientId={clientId!}
        authorizationParams={{
          redirect_uri: redirectUri,
        }}
        cacheLocation="localstorage"
        useRefreshTokens={true}
        skipRedirectCallback={true}
      >
        <App />
      </Auth0Provider>
    )}
  </React.StrictMode>,
)

