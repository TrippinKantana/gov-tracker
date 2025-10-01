import express, { Request, Response } from 'express'

const router = express.Router()

// Health check for auth
router.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'Auth0 service healthy',
    domain: process.env.AUTH0_DOMAIN ? 'configured' : 'missing',
    audience: process.env.AUTH0_AUDIENCE ? 'configured' : 'missing'
  })
})

export default router
