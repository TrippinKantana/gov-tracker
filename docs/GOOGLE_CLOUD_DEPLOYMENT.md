# Deploy to Google Cloud Platform

This guide will help you deploy your Government Asset Tracking Platform to Google Cloud, giving you a public IP to connect your GPS trackers.

## Prerequisites

1. **Google Cloud Account** - Sign up at https://cloud.google.com
2. **Google Cloud SDK** - Install from https://cloud.google.com/sdk/docs/install
3. **Node.js** (for local development)
4. **PostgreSQL Database** - We'll use Cloud SQL

## Step 1: Setup Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create gov-asset-tracker --name="Government Asset Tracker"

# Set as active project
gcloud config set project gov-asset-tracker

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

## Step 2: Create PostgreSQL Database

```bash
# Create Cloud SQL instance (PostgreSQL)
gcloud sql instances create gov-tracker-db \
    --database-version=POSTGRES_15 \
    --tier=db-n1-standard-1 \
    --region=us-central1

# Create database
gcloud sql databases create gov_asset_tracker --instance=gov-tracker-db

# Create database user
gcloud sql users create dbuser \
    --instance=gov-tracker-db \
    --password=YOUR_SECURE_PASSWORD
```

**Note:** Replace `YOUR_SECURE_PASSWORD` with a strong password.

## Step 3: Update Environment Variables

1. Edit `backend/.env` (create from `.env.example`):
```bash
PORT=8080
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.app
DATABASE_URL=postgresql://dbuser:YOUR_SECURE_PASSWORD@/gov_asset_tracker?host=/cloudsql/gov-asset-tracker:us-central1:gov-tracker-db
```

2. Get your Cloud SQL connection name:
```bash
gcloud sql instances describe gov-tracker-db --format="value(connectionName)"
```

## Step 4: Deploy to Cloud Run

```bash
# Navigate to backend directory
cd backend

# Build and deploy
gcloud run deploy gov-asset-tracker-backend \
    --source . \
    --platform managed \
    --region us-central1 \
    --port 8080 \
    --add-cloudsql-instances gov-asset-tracker:us-central1:gov-tracker-db \
    --set-env-vars "PORT=8080,NODE_ENV=production" \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 10 \
    --allow-unauthenticated
```

**For GPS Tracker Port 50100:**

Cloud Run doesn't support custom TCP ports directly. You have two options:

### Option A: Use Cloud Run for Custom Port (GPS Tracker)

Create a separate service for the GPS tracker:

```bash
# Create a custom Dockerfile for GPS ingestor only
# backend/Dockerfile.gps

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/gps ./src/gps
COPY server.js ./
CMD ["node", "-e", "const BW32Ingestor = require('./src/gps/bw32-ingestor'); const ingestor = new BW32Ingestor({port: 50100}); ingestor.start();"]
```

```bash
# Deploy GPS ingestor as separate service
gcloud run deploy gov-tracker-gps-ingestor \
    --source . \
    --platform managed \
    --region us-central1 \
    --port 50100 \
    --memory 1Gi \
    --allow-unauthenticated
```

### Option B: Use Compute Engine (Recommended for GPS Tracker)

For the GPS tracker that needs port 50100, use Compute Engine:

```bash
# Create VM instance
gcloud compute instances create gov-tracker-vm \
    --zone=us-central1-a \
    --machine-type=e2-medium \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --metadata=startup-script='#! /bin/bash
    sudo apt-get update
    sudo apt-get install -y nodejs npm git
    cd /opt
    sudo git clone YOUR_REPO_URL
    cd gov-tracker/backend
    sudo npm install
    sudo npm start'
```

Then open port 50100:
```bash
gcloud compute firewall-rules create allow-gps-tracker \
    --allow tcp:50100 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow GPS tracker connections"
```

## Step 5: Get Your Public IP

### For Cloud Run (Backend API):
```bash
gcloud run services describe gov-asset-tracker-backend \
    --region us-central1 \
    --format "value(status.url)"
```

This gives you: `https://gov-asset-tracker-backend-xxx-xx.run.app`

### For Compute Engine (GPS Tracker):
```bash
gcloud compute instances describe gov-tracker-vm \
    --zone=us-central1-a \
    --format="value(networkInterfaces[0].accessConfigs[0].natIP)"
```

This gives you: `123.456.789.12` (your public IP)

## Step 6: Configure GPS Tracker

Send SMS to your BW32 tracker:

```
#6666#APN,internet#
#6666#SERVER,YOUR_PUBLIC_IP,50100,TCP#
#6666#TIMEZONE,0#
#6666#TIMER,30#
#6666#RESET#
```

**Replace `YOUR_PUBLIC_IP` with the IP from Step 5 (Compute Engine).**

## Step 7: Deploy Frontend

### Option 1: Cloud Run
```bash
cd frontend
gcloud run deploy gov-asset-tracker-frontend \
    --source . \
    --platform managed \
    --region us-central1 \
    --set-env-vars "VITE_API_URL=https://gov-asset-tracker-backend-xxx.run.app"
```

### Option 2: Firebase Hosting (Recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting

# Build frontend
cd frontend
npm run build

# Deploy
firebase deploy --only hosting
```

## Step 8: Run Database Migrations

```bash
# Get connection info
gcloud sql connect gov-tracker-db --user=dbuser

# Run your schema
psql -d gov_asset_tracker < database/schema.sql
```

## Step 9: Verify Deployment

1. **Check backend health:**
   ```bash
   curl https://gov-asset-tracker-backend-xxx.run.app/api/health
   ```

2. **Check GPS ingestor:**
   ```bash
   curl http://YOUR_COMPUTE_IP:50100
   ```

3. **Access frontend:**
   Open your Cloud Run or Firebase URL in browser

4. **Check GPS tracker connection:**
   Look at your VM logs:
   ```bash
   gcloud compute instances get-serial-port-output gov-tracker-vm \
       --zone us-central1-a
   ```

## Recommended Architecture

```
┌─────────────────┐
│  Cloud Run      │  Main API Server (Port 8080)
│  /api/*         │  → Frontend requests
└─────────────────┘
         ↓
┌─────────────────┐
│  Cloud SQL      │  PostgreSQL Database
│  PostgreSQL     │  → All data storage
└─────────────────┘

┌─────────────────┐
│  Compute Engine │  GPS Tracker Ingestor (Port 50100)
│  /api/gps/*     │  → Receives GPS data from BW32
└─────────────────┘
         ↓
┌─────────────────┐
│  BW32 Tracker   │  GPS Device (via cellular)
│  (Cellular)      │  → Sends position data
└─────────────────┘
```

## Cost Estimation

**Minimum Setup (for testing):**
- Cloud Run: ~$0.50/month
- Cloud SQL: ~$7/month
- Compute Engine: ~$15/month
- **Total: ~$22/month**

**Production Setup (recommended):**
- Cloud Run: ~$20/month
- Cloud SQL: ~$25/month
- Compute Engine: ~$30/month
- **Total: ~$75/month**

## Security Checklist

- [ ] Enable HTTPS on Cloud Run
- [ ] Set up firewall rules for Compute Engine
- [ ] Use strong database passwords
- [ ] Enable SQL SSL connections
- [ ] Configure CORS properly
- [ ] Set up monitoring and alerts
- [ ] Enable backup for Cloud SQL
- [ ] Use secrets management for sensitive data

## Next Steps

1. Set up monitoring in Google Cloud Console
2. Configure automatic backups for database
3. Set up alerts for downtime
4. Enable Cloud CDN for frontend
5. Set up CI/CD with Cloud Build

## Troubleshooting

**GPS tracker not connecting:**
```bash
# Check firewall rules
gcloud compute firewall-rules list | grep 50100

# Check VM logs
gcloud compute instances get-serial-port-output gov-tracker-vm
```

**Database connection issues:**
```bash
# Test database connection
gcloud sql connect gov-tracker-db --user=dbuser

# Check Cloud SQL logs
gcloud sql operations list --instance=gov-tracker-db
```

**Backend not starting:**
```bash
# Check Cloud Run logs
gcloud run services logs read gov-asset-tracker-backend

# Check recent revisions
gcloud run revisions list --service gov-asset-tracker-backend
```

## Quick Start Commands

```bash
# 1. Initial setup
gcloud projects create gov-asset-tracker
gcloud config set project gov-asset-tracker
gcloud services enable run.googleapis.com sqladmin.googleapis.com

# 2. Create database
gcloud sql instances create gov-tracker-db --database-version=POSTGRES_15 --tier=db-n1-standard-1 --region=us-central1
gcloud sql databases create gov_asset_tracker --instance=gov-tracker-db
gcloud sql users create dbuser --instance=gov-tracker-db --password=CHANGE_ME

# 3. Deploy backend
cd backend
gcloud run deploy gov-asset-tracker-backend --source . --region us-central1 --allow-unauthenticated

# 4. Get public IP
gcloud run services describe gov-asset-tracker-backend --region us-central1 --format "value(status.url)"

# 5. Deploy frontend
cd ../frontend
gcloud run deploy gov-asset-tracker-frontend --source . --region us-central1
```

Your application is now deployed and accessible from anywhere with a public IP!
