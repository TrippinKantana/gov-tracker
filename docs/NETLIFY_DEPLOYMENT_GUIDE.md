# Netlify Deployment Guide

This guide explains how to deploy the Government Asset Tracking Platform frontend to Netlify while keeping your backend API running separately.

## 🏗️ Architecture Overview

When deploying to Netlify (frontend) and Railway (backend), here's how the architecture works:

```
┌─────────────────────────────────────────────────────────┐
│                    NETLIFY (Frontend)                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │  React App (Static Files)                         │  │
│  │  - Built with Vite                                │  │
│  │  - Served as static HTML/CSS/JS                    │  │
│  │  - Environment variables injected at build time    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │
                        │ HTTP/HTTPS API Calls
                        │ (via VITE_API_URL)
                        │ WebSocket (Socket.IO)
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  RAILWAY (Backend API)                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Node.js/Express Server                           │  │
│  │  - REST API endpoints                             │  │
│  │  - Socket.IO for real-time updates                │  │
│  │  - PostgreSQL database (Railway or Neon)          │  │
│  │  - Automatic HTTPS                                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Key Points:

1. **Frontend on Netlify**: Static React app, built and served by Netlify
2. **Backend on Railway**: Express server running on Railway with automatic HTTPS
3. **Communication**: Frontend makes API calls to your Railway backend URL
4. **CORS**: Railway backend must allow requests from your Netlify domain
5. **Database**: PostgreSQL on Railway or external (Neon)

---

## 📋 Prerequisites

Before deploying to Netlify, ensure:

- ✅ Your backend API is deployed on Railway (see [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPL
OYMENT_GUIDE.md))
- ✅ Backend CORS is configured to allow your Netlify domain
- ✅ You have your Railway backend URL (e.g., `https://your-app.up.railway.app`)
- ✅ You have a GitHub repository with your code
- ✅ You have a Netlify account (free tier works)

---

## 🚀 Step 1: Deploy Backend to Railway

**First, deploy your backend to Railway!** See the complete guide: [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)

### Quick Summary:

1. **Connect GitHub to Railway**
2. **Set root directory to `backend`**
3. **Add environment variables**:
   - `DATABASE_URL` (Railway PostgreSQL or Neon)
   - `FRONTEND_URL` (your Netlify URL)
   - `NETLIFY_URL` (same as FRONTEND_URL)
4. **Get your Railway backend URL**: `https://your-app.up.railway.app`

### 1.1 Backend CORS Configuration

Railway backend should already be configured (see Railway guide), but ensure it includes:

```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.NETLIFY_URL || "",
  "http://localhost:3000"
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

**In Railway, set environment variable:**
- `NETLIFY_URL=https://your-app-name.netlify.app`

### 1.2 Get Your Railway Backend URL

After deploying to Railway:
- Your backend URL will be: `https://your-service-name.up.railway.app`
- **Save this URL** - you'll need it for Netlify configuration!

---

## 🎨 Step 2: Update Frontend for Production

### 2.1 Create Environment Variable Configuration

The frontend uses `VITE_API_URL` in some places, but some components still use hardcoded URLs. We need to standardize this.

**Create `frontend/.env.production` (optional - Netlify will use dashboard variables):**

```env
VITE_API_URL=https://your-app.up.railway.app/api
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_REDIRECT_URI=https://your-app-name.netlify.app
VITE_MAPBOX_TOKEN=your-mapbox-token
```

**Note**: Replace `your-app.up.railway.app` with your actual Railway backend URL.

### 2.2 Update Hardcoded API URLs

Some components still use hardcoded `http://localhost:5000`. We need to create a centralized API configuration.

**Create `frontend/src/config/api.ts`:**

```typescript
// Centralized API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getApiUrl = (endpoint: string = '') => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Ensure API_BASE_URL doesn't end with /api if endpoint already includes it
  const base = API_BASE_URL.endsWith('/api') 
    ? API_BASE_URL 
    : `${API_BASE_URL}/api`;
  
  return `${base}/${cleanEndpoint}`;
};

export default API_BASE_URL;
```

Then update components to use this:

**Example update for `frontend/src/pages/Vehicles.tsx`:**

```typescript
// Replace:
const response = await fetch('http://localhost:5000/api/vehicles');

// With:
import { getApiUrl } from '../config/api';
const response = await fetch(getApiUrl('vehicles'));
```

### 2.3 Update Socket.IO Connection

Update `frontend/src/contexts/NotificationContext.tsx`:

```typescript
// Get API URL from environment or default to localhost for development
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Convert API URL to socket URL by removing /api suffix
const socketUrl = apiUrl.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://');
```

---

## 🌐 Step 3: Deploy to Netlify

### 3.1 Connect Repository to Netlify

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Go to Netlify Dashboard**:
   - Visit [https://app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository

### 3.2 Configure Build Settings

In Netlify, configure:

**Base directory**: `frontend`
**Build command**: `npm run build`
**Publish directory**: `frontend/dist`

**Or use `netlify.toml`** (recommended):

Create `netlify.toml` in your project root:

```toml
[build]
  base = "frontend"
  command = "npm install && npm run build"
  publish = "frontend/dist"

[build.environment]
  NODE_VERSION = "18"

# Redirect all routes to index.html for SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Proxy API requests (optional - see below)
# [[redirects]]
#   from = "/api/*"
#   to = "https://your-backend-url.com/api/:splat"
#   status = 200
#   force = true
```

### 3.3 Set Environment Variables

In Netlify Dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add these variables:

```
VITE_API_URL = https://your-app.up.railway.app/api
VITE_AUTH0_DOMAIN = your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID = your-auth0-client-id
VITE_AUTH0_REDIRECT_URI = https://your-app-name.netlify.app
VITE_MAPBOX_TOKEN = your-mapbox-token
```

**Important**: 
- Replace `your-app.up.railway.app` with your actual Railway backend URL
- Replace `your-app-name.netlify.app` with your actual Netlify URL (or custom domain)

### 3.4 Deploy

1. Click **"Deploy site"** in Netlify
2. Netlify will:
   - Install dependencies
   - Run build command
   - Deploy to CDN
3. Your site will be live at `https://your-app-name.netlify.app`

---

## 🔄 Step 4: Configure API Proxy (Optional)

Instead of hardcoding the backend URL, you can use Netlify's redirects to proxy API requests:

**Update `netlify.toml`:**

```toml
# Proxy API requests to Railway backend
[[redirects]]
  from = "/api/*"
  to = "https://your-app.up.railway.app/api/:splat"
  status = 200
  force = true
  headers = {X-From = "Netlify"}
```

**Note**: Replace `your-app.up.railway.app` with your actual Railway backend URL.

**Then update frontend to use relative URLs:**

```typescript
// Use relative path - Netlify will proxy to backend
const response = await fetch('/api/vehicles');
```

**Benefits:**
- ✅ No CORS issues (same origin)
- ✅ Easier to switch backends
- ✅ Can add authentication headers

**Drawbacks:**
- ❌ Adds latency (extra hop)
- ❌ Netlify Functions have execution time limits
- ❌ Socket.IO won't work through proxy

---

## 🔌 Step 5: Handle Socket.IO Connection

Socket.IO requires a direct WebSocket connection to your backend. The proxy approach won't work for real-time features.

**Solution**: Connect directly to backend for Socket.IO:

```typescript
// In NotificationContext.tsx or similar
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const socketUrl = apiUrl.replace('/api', '');

// Connect to backend directly
const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  withCredentials: true
});
```

**Backend must allow WebSocket connections from Netlify domain.**

---

## 🧪 Step 6: Test Your Deployment

### 6.1 Test API Connection

1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate your app
4. Check API requests:
   - ✅ Should go to your backend URL
   - ✅ Should return 200 status
   - ❌ If CORS errors, update backend CORS config

### 6.2 Test Authentication

1. Try logging in
2. Check Auth0 redirect works
3. Verify tokens are stored

### 6.3 Test Real-time Features

1. Open app in two browsers
2. Make a change in one
3. Verify it updates in the other (Socket.IO)

---

## 🔒 Step 7: Security Considerations

### 7.1 HTTPS Only

- ✅ Netlify provides HTTPS automatically
- ✅ Backend should also use HTTPS
- ✅ Update Auth0 redirect URI to HTTPS

### 7.2 Environment Variables

- ✅ Never commit `.env` files
- ✅ Use Netlify's environment variables
- ✅ Different values for production vs preview

### 7.3 CORS

- ✅ Only allow your Netlify domain
- ✅ Don't use `*` in production
- ✅ Include credentials only when needed

---

## 🐛 Troubleshooting

### Issue: CORS Errors

**Symptoms**: Browser console shows CORS errors

**Solution**:
1. Check backend CORS configuration includes Netlify URL
2. Verify backend is accessible
3. Check browser console for exact error

### Issue: API Returns 404

**Symptoms**: API calls return 404 Not Found

**Solution**:
1. Verify `VITE_API_URL` is set correctly in Netlify (should be `https://your-app.up.railway.app/api`)
2. Check Railway backend is running (view logs in Railway dashboard)
3. Test Railway backend URL directly: `https://your-app.up.railway.app/api/vehicles`
4. Verify Railway deployment succeeded

### Issue: Socket.IO Not Connecting

**Symptoms**: Real-time features don't work

**Solution**:
1. Socket.IO needs direct connection (not through proxy)
2. Verify WebSocket port is open on backend
3. Check backend Socket.IO CORS configuration

### Issue: Build Fails

**Symptoms**: Netlify build fails

**Solution**:
1. Check build logs in Netlify
2. Verify `package.json` has correct build script
3. Ensure all dependencies are in `package.json`
4. Check Node version matches (use `NODE_VERSION` in netlify.toml)

### Issue: Environment Variables Not Working

**Symptoms**: App uses default/localhost URLs

**Solution**:
1. Environment variables must start with `VITE_` for Vite
2. Rebuild after adding variables
3. Check variable names match exactly

---

## 📊 Alternative: Netlify Functions (Not Recommended)

**Why not use Netlify Functions?**

Your backend is complex with:
- ❌ Socket.IO (requires persistent connection)
- ❌ GPS tracker integration (long-running connections)
- ❌ Database connections (connection pooling)
- ❌ File uploads (large files)
- ❌ Real-time features

Netlify Functions are better for:
- ✅ Simple API endpoints
- ✅ Serverless functions
- ✅ Short-lived requests

**Recommendation**: Keep backend separate, use Netlify only for frontend.

---

## 🎯 Summary

**What Netlify Hosts:**
- ✅ React frontend (static files)
- ✅ Built with Vite
- ✅ Served via CDN

**What Stays Separate:**
- ✅ Node.js/Express backend
- ✅ PostgreSQL database
- ✅ Socket.IO server
- ✅ GPS tracker integration

**Communication:**
- Frontend → Backend: HTTP/HTTPS API calls
- Frontend → Backend: WebSocket for Socket.IO
- Backend → Database: Direct connection

**Configuration:**
- Environment variables in Netlify dashboard
- CORS configured on backend
- API URL set in `VITE_API_URL`

---

## 📚 Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT_GUIDE.md) - Complete backend setup
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Netlify Redirects](https://docs.netlify.com/routing/redirects/)
- [CORS Configuration](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Railway Documentation](https://docs.railway.app/)

---

## ✅ Deployment Checklist

- [ ] **Backend on Railway**:
  - [ ] Railway account created
  - [ ] Backend deployed to Railway
  - [ ] Railway backend URL obtained
  - [ ] Database connected (Railway PostgreSQL or Neon)
  - [ ] Environment variables set in Railway
  - [ ] Backend CORS configured for Netlify domain
  - [ ] Backend API tested and working

- [ ] **Frontend on Netlify**:
  - [ ] Frontend hardcoded URLs replaced with environment variables
  - [ ] `netlify.toml` created with build settings
  - [ ] Environment variables set in Netlify dashboard (including `VITE_API_URL` with Railway URL)
  - [ ] Repository connected to Netlify
  - [ ] Build successful
  - [ ] API calls working
  - [ ] Authentication working
  - [ ] Socket.IO connection working
  - [ ] Custom domain configured (optional)

---

**Your platform is now live on Netlify!** 🎉

