export const auth0Config = {
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  audience: process.env.AUTH0_AUDIENCE!,
  scope: 'read:current_user update:current_user_metadata',
  algorithms: ['RS256'] as const
}

if (!auth0Config.domain) {
  throw new Error('AUTH0_DOMAIN environment variable is required')
}

if (!auth0Config.clientId) {
  throw new Error('AUTH0_CLIENT_ID environment variable is required')  
}

if (!auth0Config.clientSecret) {
  throw new Error('AUTH0_CLIENT_SECRET environment variable is required')
}

if (!auth0Config.audience) {
  throw new Error('AUTH0_AUDIENCE environment variable is required')
}

export default auth0Config
