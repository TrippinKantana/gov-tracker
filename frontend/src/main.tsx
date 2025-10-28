import React from 'react'
import ReactDOM from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import App from './App.tsx'
import './index.css'

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin

// Check if we're on HTTP (development mode without HTTPS)
const isHttp = window.location.protocol === 'http:'
const hasAuth0Creds = domain && clientId

// Skip Auth0 completely on HTTP
const shouldSkipAuth0 = isHttp

// Warn if trying to use Auth0 on HTTP
if (isHttp && hasAuth0Creds) {
  console.warn('⚠️ Auth0 requires HTTPS. Disabling Auth0 and using dev mode.');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {shouldSkipAuth0 ? (
      // HTTP mode - skip Auth0 completely
      <App />
    ) : (
      // HTTPS mode - use Auth0
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

