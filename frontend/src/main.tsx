import React from 'react'
import ReactDOM from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import App from './App.tsx'
import './index.css'

const domain = import.meta.env.VITE_AUTH0_DOMAIN || 'dev-localhost.us.auth0.com'
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || 'dev-client-id'
const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Auth0Provider 
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
      skipRedirectCallback={true}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>,
)

