# Quick Deployment Reference: Netlify + Railway

This is a quick reference guide for deploying your Government Asset Tracking Platform using **Netlify (frontend)** and **Railway (backend)**.

## 🎯 Architecture

```
Netlify (Frontend) → Railway (Backend) → PostgreSQL (Railway or Neon)
```

## 📋 Deployment Order

1. **Deploy Backend to Railway** (do this first)
2. **Deploy Frontend to Netlify** (after backend is live)

---

## 🚂 Step 1: Deploy Backend to Railway

### Quick Steps:

1. **Sign up**: [railway.app](https://railway.app)
2. **Create Project**: New Project → Deploy from GitHub
3. **Configure**:
   - Root Directory: `backend`
   - Start Command: `npm start` (auto-detected)
4. **Add Environment Variables**:
   ```
   DATABASE_URL=your-postgres-connection-string
   FRONTEND_URL=https://your-app.netlify.app
   NETLIFY_URL=https://your-app.netlify.app
   PORT=5000
   NODE_ENV=production
   ```
5. **Get Railway URL**: `https://your-app.up.railway.app`

📖 **Full Guide**: [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)

---

## 🌐 Step 2: Deploy Frontend to Netlify

### Quick Steps:

1. **Sign up**: [netlify.com](https://netlify.com)
2. **Import Project**: Add site → Import from GitHub
3. **Configure Build**:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
4. **Add Environment Variables**:
   ```
   VITE_API_URL=https://your-app.up.railway.app/api
   VITE_AUTH0_DOMAIN=your-auth0-domain
   VITE_AUTH0_CLIENT_ID=your-auth0-client-id
   VITE_AUTH0_REDIRECT_URI=https://your-app.netlify.app
   VITE_MAPBOX_TOKEN=your-mapbox-token
   ```
5. **Deploy**: Netlify will auto-deploy

📖 **Full Guide**: [NETLIFY_DEPLOYMENT_GUIDE.md](./NETLIFY_DEPLOYMENT_GUIDE.md)

---

## 🔗 Connecting Frontend to Backend

### In Netlify Environment Variables:

Set `VITE_API_URL` to your Railway backend URL:
```
VITE_API_URL=https://your-app.up.railway.app/api
```

### In Railway Environment Variables:

Set `NETLIFY_URL` to your Netlify frontend URL:
```
NETLIFY_URL=https://your-app.netlify.app
```

This allows CORS to work properly.

---

## ✅ Quick Checklist

### Backend (Railway):
- [ ] Railway account created
- [ ] Project created and connected to GitHub
- [ ] Root directory set to `backend`
- [ ] Environment variables added
- [ ] Database connected (Railway PostgreSQL or Neon)
- [ ] Deployment successful
- [ ] Backend URL obtained: `https://your-app.up.railway.app`

### Frontend (Netlify):
- [ ] Netlify account created
- [ ] Site created and connected to GitHub
- [ ] Build settings configured
- [ ] Environment variables added (including `VITE_API_URL` with Railway URL)
- [ ] Deployment successful
- [ ] Frontend URL obtained: `https://your-app.netlify.app`

### Integration:
- [ ] Railway `NETLIFY_URL` set to Netlify URL
- [ ] Netlify `VITE_API_URL` set to Railway URL + `/api`
- [ ] Test API calls from frontend
- [ ] Test Socket.IO connection
- [ ] Verify CORS is working

---

## 🧪 Testing

### Test Backend:
```bash
curl https://your-app.up.railway.app/api/vehicles
```

### Test Frontend:
1. Open `https://your-app.netlify.app`
2. Check browser console for errors
3. Verify API calls are going to Railway URL
4. Test all features

---

## 🐛 Common Issues

### CORS Errors
- ✅ Verify `NETLIFY_URL` is set in Railway
- ✅ Verify `VITE_API_URL` is set in Netlify
- ✅ Check backend CORS configuration

### API Not Found
- ✅ Verify Railway backend is running
- ✅ Check Railway logs
- ✅ Verify `VITE_API_URL` includes `/api` suffix

### Socket.IO Not Working
- ✅ Verify WebSocket support (Railway supports this)
- ✅ Check Socket.IO CORS configuration
- ✅ Verify frontend connects to correct URL

---

## 📚 Full Documentation

- **Railway Backend**: [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)
- **Netlify Frontend**: [NETLIFY_DEPLOYMENT_GUIDE.md](./NETLIFY_DEPLOYMENT_GUIDE.md)

---

## 💰 Cost Estimate

### Free Tier:
- **Railway**: $5 credit/month (usually enough for small apps)
- **Netlify**: Free tier (100GB bandwidth, 300 build minutes)
- **Neon Database**: Free tier (0.5GB storage)

### Total: **$0/month** for development/testing

### Production:
- **Railway**: ~$5-10/month (pay-as-you-go)
- **Netlify**: Free tier usually sufficient
- **Neon**: $19/month for production

### Total: **~$24-29/month** for production

---

**Ready to deploy?** Start with the Railway guide, then move to Netlify! 🚀

