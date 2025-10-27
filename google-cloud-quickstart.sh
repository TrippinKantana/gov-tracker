#!/bin/bash
# Quick Start Script for Google Cloud Deployment

set -e

PROJECT_ID="gov-asset-tracker"
REGION="us-central1"
DB_INSTANCE="gov-tracker-db"

echo "🚀 Starting Google Cloud Deployment..."

# 1. Set project
echo "📝 Setting up project..."
gcloud config set project $PROJECT_ID

# 2. Enable required APIs
echo "🔧 Enabling APIs..."
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable compute.googleapis.com

# 3. Create PostgreSQL database
echo "🗄️ Creating database..."
gcloud sql instances create $DB_INSTANCE \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=$REGION \
    --backup \
    --enable-bin-log \
    --no-assign-ip || echo "Database already exists"

gcloud sql databases create gov_asset_tracker --instance=$DB_INSTANCE || echo "Database already exists"

read -sp "Enter database password: " DB_PASSWORD
echo ""
gcloud sql users set-password postgres --instance=$DB_INSTANCE --password=$DB_PASSWORD || true

# 4. Get connection info
echo "🔗 Getting database connection..."
DB_CONNECTION=$(gcloud sql instances describe $DB_INSTANCE --format="value(connectionName)")
echo "Database connection: $DB_CONNECTION"

# 5. Deploy backend to Cloud Run
echo "📦 Deploying backend..."
cd backend
gcloud run deploy gov-asset-tracker-backend \
    --source . \
    --platform managed \
    --region $REGION \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 10 \
    --add-cloudsql-instances $DB_CONNECTION \
    --set-env-vars "PORT=8080,NODE_ENV=production" \
    --allow-unauthenticated

# 6. Get public URL
BACKEND_URL=$(gcloud run services describe gov-asset-tracker-backend --region $REGION --format "value(status.url)")
echo "✅ Backend deployed at: $BACKEND_URL"

# 7. Create Compute Engine VM for GPS tracker
echo "🛰️ Creating VM for GPS tracker..."
gcloud compute instances create gov-tracker-vm \
    --zone=${REGION}-a \
    --machine-type=e2-small \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=20GB \
    --tags=http-server,https-server,gps-tracker \
    --metadata=startup-script='#!/bin/bash
sudo apt-get update
sudo apt-get install -y nodejs npm git
sudo npm install -g pm2
cd /opt
sudo git clone https://github.com/YOUR_USERNAME/gov-tracker.git
cd gov-tracker/backend
sudo npm install
sudo pm2 start server.js
sudo pm2 startup
sudo pm2 save' || echo "VM already exists"

# 8. Get VM IP
VM_IP=$(gcloud compute instances describe gov-tracker-vm --zone=${REGION}-a --format="value(networkInterfaces[0].accessConfigs[0].natIP)")
echo "✅ VM IP: $VM_IP"

# 9. Create firewall rules
echo "🔥 Setting up firewall..."
gcloud compute firewall-rules create allow-gps-tracker \
    --allow tcp:50100 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow GPS tracker connections" || echo "Firewall rule already exists"

# 10. Summary
echo ""
echo "🎉 Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Backend URL: $BACKEND_URL"
echo "GPS Tracker IP: $VM_IP"
echo "Database: $DB_CONNECTION"
echo ""
echo "📱 Configure your GPS tracker with this SMS:"
echo "#6666#APN,internet#"
echo "#6666#SERVER,$VM_IP,50100,TCP#"
echo "#6666#TIMEZONE,0#"
echo "#6666#TIMER,30#"
echo "#6666#RESET#"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
