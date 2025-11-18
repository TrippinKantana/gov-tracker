# Railway Backend Deployment Guide

This guide walks you through deploying your Government Asset Tracking Platform backend to Railway.

## 🚂 What is Railway?

Railway is a modern platform that makes it easy to deploy and run your backend services. It provides:
- ✅ Automatic HTTPS
- ✅ PostgreSQL database hosting
- ✅ Environment variable management
- ✅ Automatic deployments from GitHub
- ✅ Free tier with $5 credit/month

---

## 📋 Prerequisites

Before deploying to Railway:

- ✅ GitHub account
- ✅ Railway account (sign up at [railway.app](https://railway.app))
- ✅ Your code pushed to GitHub
- ✅ Neon PostgreSQL database (or Railway PostgreSQL)

---

## 🚀 Step 1: Prepare Your Backend

### 1.1 Update Server Configuration

Railway automatically sets the `PORT` environment variable. Your server should use it:

```javascript
// backend/server.js already uses:
const DEFAULT_PORT = process.env.PORT || 5000;
```

✅ This is already configured correctly!

### 1.2 Update CORS Configuration

Update `backend/server.js` to allow your Netlify frontend:

```javascript
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      process.env.NETLIFY_URL || "",  // Will be set in Railway
      "http://localhost:3000"
    ].filter(Boolean),  // Remove empty strings
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  }
});

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    process.env.NETLIFY_URL || "",
    "http://localhost:3000"
  ].filter(Boolean),
  credentials: true
}));
```

### 1.3 Update Start Script

Ensure `package.json` has the correct start command:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  }
}
```

✅ Already configured!

### 1.4 Handle GPS Tracker Port (Optional)

**Note**: Railway doesn't support custom ports for incoming connections. If you need GPS tracker integration, you have two options:

**Option A**: Use Railway's public domain (recommended)
- GPS trackers can connect to `your-app.railway.app:443` (HTTPS)
- You'll need to configure your GPS handler to accept connections on the main port

**Option B**: Keep GPS tracker on separate service
- Deploy GPS tracker handler separately (Google Cloud VM, etc.)
- Or use a service that supports custom ports

For now, we'll deploy the main API. GPS tracker can be added later.

---

## 🗄️ Step 2: Set Up Database

### Option A: Use Railway PostgreSQL (Recommended)

Railway provides managed PostgreSQL databases:

1. **In Railway Dashboard**:
   - Click "New Project"
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will create a PostgreSQL database
   - Copy the connection string (looks like: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`)

2. **Set as Environment Variable**:
   - In your Railway service settings
   - Add environment variable: `DATABASE_URL`
   - Paste the connection string

### Option B: Use Neon PostgreSQL (External)

If you're already using Neon:

1. **Get Connection String**:
   - From your Neon dashboard
   - Copy the connection string

2. **Set in Railway**:
   - Add environment variable: `DATABASE_URL`
   - Paste your Neon connection string

---

## 🚂 Step 3: Deploy to Railway

### 3.1 Connect GitHub Repository

1. **Go to Railway Dashboard**:
   - Visit [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will detect it's a Node.js project

### 3.2 Configure Service

1. **Set Root Directory**:
   - In service settings → "Settings" tab
   - Set "Root Directory" to: `backend`

2. **Configure Build**:
   - Railway auto-detects Node.js
   - Build command: `npm install` (automatic)
   - Start command: `npm start` (uses package.json)

3. **Set Environment Variables**:
   - Go to "Variables" tab
   - Add these variables:

```
PORT=5000
NODE_ENV=production
DATABASE_URL=your-database-connection-string
FRONTEND_URL=https://your-app-name.netlify.app
NETLIFY_URL=https://your-app-name.netlify.app
```

**Important**: Replace `your-app-name.netlify.app` with your actual Netlify URL.

### 3.3 Deploy

1. **Railway will automatically**:
   - Install dependencies
   - Build your app
   - Start the server
   - Provide a public URL

2. **Get Your Backend URL**:
   - Railway provides a URL like: `https://your-app.up.railway.app`
   - Copy this URL - you'll need it for Netlify!

3. **Check Logs**:
   - Go to "Deployments" tab
   - Click on the latest deployment
   - View logs to ensure server started correctly

---

## 🔧 Step 4: Configure Environment Variables

### Required Variables

Add these in Railway dashboard → Your Service → Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port (Railway sets this automatically) | `5000` |
| `NODE_ENV` | Environment | `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `FRONTEND_URL` | Your Netlify frontend URL | `https://your-app.netlify.app` |
| `NETLIFY_URL` | Same as FRONTEND_URL (for CORS) | `https://your-app.netlify.app` |

### Optional Variables

If you're using Auth0:

| Variable | Description |
|----------|-------------|
| `AUTH0_DOMAIN` | Your Auth0 domain |
| `AUTH0_AUDIENCE` | Your Auth0 API audience |
| `JWT_SECRET` | JWT signing secret |

---

## 🌐 Step 5: Get Your Railway URL

After deployment:

1. **Railway provides a public URL**:
   - Format: `https://your-service-name.up.railway.app`
   - This is your backend API URL

2. **Use this URL in Netlify**:
   - Set `VITE_API_URL` in Netlify to: `https://your-service-name.up.railway.app/api`

3. **Custom Domain (Optional)**:
   - Railway supports custom domains
   - Go to "Settings" → "Domains"
   - Add your custom domain
   - Update DNS records as instructed

---

## 🔒 Step 6: Update CORS for Production

Update your backend to accept requests from Netlify:

**In Railway, add environment variable:**
```
NETLIFY_URL=https://your-app-name.netlify.app
```

**Your backend code should already handle this** (if you updated it in Step 1.2).

---

## 🧪 Step 7: Test Your Deployment

### 7.1 Test API Endpoints

1. **Health Check**:
   ```bash
   curl https://your-service-name.up.railway.app/health
   ```

2. **Test API**:
   ```bash
   curl https://your-service-name.up.railway.app/api/vehicles
   ```

### 7.2 Check Logs

In Railway dashboard:
- Go to "Deployments"
- Click on latest deployment
- View "Logs" tab
- Look for:
  - ✅ `Server running on port...`
  - ✅ `Database connected successfully`
  - ✅ No error messages

### 7.3 Test from Frontend

1. **Update Netlify environment variables**:
   - Set `VITE_API_URL` to: `https://your-service-name.up.railway.app/api`

2. **Redeploy Netlify**:
   - Netlify will rebuild with new API URL

3. **Test in browser**:
   - Open your Netlify app
   - Check browser console for API calls
   - Verify data loads correctly

---

## 🔄 Step 8: Continuous Deployment

Railway automatically deploys when you push to GitHub:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Update backend"
   git push origin main
   ```

2. **Railway detects changes**:
   - Automatically starts new deployment
   - Builds and deploys your changes

3. **Monitor deployment**:
   - Check Railway dashboard
   - View deployment logs
   - Verify deployment succeeded

---

## 🐛 Troubleshooting

### Issue: Build Fails

**Symptoms**: Railway build fails

**Solution**:
1. Check build logs in Railway
2. Ensure `package.json` has correct scripts
3. Verify all dependencies are listed
4. Check Node version (Railway uses Node 18 by default)

### Issue: Server Won't Start

**Symptoms**: Deployment succeeds but server doesn't start

**Solution**:
1. Check logs in Railway dashboard
2. Verify `PORT` environment variable (Railway sets this automatically)
3. Ensure `npm start` command works locally
4. Check for missing environment variables

### Issue: Database Connection Fails

**Symptoms**: Database connection errors in logs

**Solution**:
1. Verify `DATABASE_URL` is set correctly
2. Check database is running (Railway dashboard)
3. Ensure connection string includes SSL if required
4. Test connection string locally

### Issue: CORS Errors

**Symptoms**: Frontend can't connect to backend

**Solution**:
1. Verify `NETLIFY_URL` is set in Railway
2. Check backend CORS configuration
3. Ensure frontend URL matches exactly (including https://)
4. Check browser console for exact CORS error

### Issue: Socket.IO Not Working

**Symptoms**: Real-time features don't work

**Solution**:
1. Socket.IO needs WebSocket support
2. Railway supports WebSockets automatically
3. Verify Socket.IO CORS configuration
4. Check frontend connects to correct URL

---

## 💰 Railway Pricing

### Free Tier
- $5 credit/month
- 500 hours of usage
- Perfect for development/testing

### Paid Plans
- Pay-as-you-go after free credit
- ~$0.000463 per GB-hour
- Very affordable for small to medium apps

**Example**: A small backend might cost $5-10/month

---

## 📊 Monitoring & Logs

### View Logs

1. **In Railway Dashboard**:
   - Go to your service
   - Click "Deployments"
   - Select a deployment
   - View "Logs" tab

2. **Real-time Logs**:
   - Click "View Logs" in service overview
   - See live server logs

### Metrics

Railway provides:
- CPU usage
- Memory usage
- Network traffic
- Request metrics

---

## 🔐 Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` files
- ✅ Use Railway's environment variables
- ✅ Keep secrets secure

### 2. Database
- ✅ Use SSL connections
- ✅ Don't expose database URLs
- ✅ Use connection pooling

### 3. CORS
- ✅ Only allow your Netlify domain
- ✅ Don't use `*` in production
- ✅ Include credentials only when needed

### 4. HTTPS
- ✅ Railway provides HTTPS automatically
- ✅ Always use HTTPS in production

---

## 🎯 Next Steps

After deploying to Railway:

1. ✅ **Update Netlify**:
   - Set `VITE_API_URL` to your Railway URL
   - Redeploy frontend

2. ✅ **Test Integration**:
   - Test API calls from frontend
   - Verify Socket.IO connection
   - Test all features

3. ✅ **Monitor**:
   - Watch Railway logs
   - Monitor usage
   - Set up alerts if needed

4. ✅ **Custom Domain** (Optional):
   - Add custom domain to Railway
   - Update DNS records
   - Update Netlify `VITE_API_URL`

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Node.js on Railway](https://docs.railway.app/guides/nodejs)

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] New project created in Railway
- [ ] GitHub repository connected
- [ ] Root directory set to `backend`
- [ ] Environment variables configured
- [ ] Database connected (Railway or Neon)
- [ ] Deployment successful
- [ ] Backend URL obtained
- [ ] API endpoints tested
- [ ] CORS configured correctly
- [ ] Netlify updated with Railway URL
- [ ] Frontend-backend integration tested

---

**Your backend is now live on Railway!** 🚂

