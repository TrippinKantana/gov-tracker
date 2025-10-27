# Deploy to Google Cloud - Step by Step Guide

This guide will help you deploy your app to Google Cloud and get a public IP for your GPS tracker.

## Prerequisites

1. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. Have a Google account (or create one at https://cloud.google.com)

## Quick Setup (5 Steps)

### Step 1: Install Google Cloud SDK

Download and install from: https://cloud.google.com/sdk/docs/install

After installation, open PowerShell and run:
```powershell
gcloud auth login
```

### Step 2: Create Google Cloud Project

```powershell
# Create new project
gcloud projects create gov-asset-tracker --name="Gov Asset Tracker"

# Set as active project
gcloud config set project gov-asset-tracker

# Enable required services
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable compute.googleapis.com
```

### Step 3: Deploy Backend to Cloud Run

```powershell
cd backend

# Deploy to Cloud Run (this will build and deploy automatically)
gcloud run deploy gov-tracker-backend `
    --source . `
    --region us-central1 `
    --allow-unauthenticated `
    --port 8080 `
    --memory 2Gi

# Note your backend URL (something like: https://gov-tracker-backend-xxx.run.app)
```

This gives you a public URL for your backend API.

### Step 4: Get Public IP for GPS Tracker

Cloud Run doesn't support port 50100. You need a Compute Engine VM:

```powershell
# Create VM
gcloud compute instances create gps-tracker-vm `
    --zone=us-central1-a `
    --machine-type=e2-small `
    --image-family=ubuntu-2204-lts `
    --image-project=ubuntu-os-cloud `
    --boot-disk-size=20GB

# Create firewall rule for port 50100
gcloud compute firewall-rules create allow-gps-tracker `
    --allow tcp:50100 `
    --source-ranges 0.0.0.0/0 `
    --description "Allow GPS tracker port 50100"

# Get the public IP
gcloud compute instances describe gps-tracker-vm --zone=us-central1-a --format="value(networkInterfaces[0].accessConfigs[0].natIP)"
```

### Step 5: Setup GPS Tracker on VM

You'll need to SSH into the VM and set up your backend:

```powershell
# SSH into VM
gcloud compute ssh gps-tracker-vm --zone=us-central1-a

# Inside the VM, run:
sudo apt-get update
sudo apt-get install -y nodejs npm git

# Clone your repo (or copy files)
git clone https://github.com/YOUR_USERNAME/gov-tracker.git
cd gov-tracker/backend
npm install
npm start

# Keep the terminal open so the server stays running
```

### Step 6: Configure Your GPS Tracker

Send SMS to your tracker (use the VM's public IP from Step 4):

```
#6666#APN,internet#
#6666#SERVER,YOUR_VM_IP,50100,TCP#
#6666#TIMEZONE,0#
#6666#TIMER,30#
#6666#RESET#
```

## Alternative: Use Cloud Run with Port Mapping

If you want everything in one service, you'll need to modify your server to accept both ports:

1. **Modify backend/server.js** to listen on both 8080 and 50100
2. Deploy to Cloud Run
3. Use the Cloud Run URL for both API and GPS

But **this won't work** because Cloud Run only exposes HTTP ports.

## Recommended: Use One VM for Everything

Better approach - run everything on one VM:

```powershell
# Create VM with startup script
gcloud compute instances create gov-tracker-vm `
    --zone=us-central1-a `
    --machine-type=e2-medium `
    --image-family=ubuntu-2204-lts `
    --image-project=ubuntu-os-cloud `
    --boot-disk-size=30GB `
    --metadata-from-file startup-script=setup-vm.ps1

# Create firewall rules
gcloud compute firewall-rules create allow-backend-api `
    --allow tcp:5000 `
    --source-ranges 0.0.0.0/0 `
    --description "Backend API port"

gcloud compute firewall-rules create allow-gps-tracker `
    --allow tcp:50100 `
    --source-ranges 0.0.0.0/0 `
    --description "GPS Tracker port"

# Get public IP
gcloud compute instances describe gov-tracker-vm --zone=us-central1-a --format="value(networkInterfaces[0].accessConfigs[0].natIP)"
```

## Cost Estimate

**Per Month:**
- Compute Engine VM (e2-medium): ~$24
- Cloud SQL (if using): ~$7
- Cloud Run (if using): ~$0.50
- **Total: ~$25-32/month**

## Important Notes

1. **VM must stay running** - Unlike Cloud Run, your VM needs to be running 24/7 for GPS tracking to work
2. **Firewall** - Make sure ports 5000 (API) and 50100 (GPS) are open
3. **Auto-start** - Configure VM to auto-start your backend on boot
4. **Monitoring** - Set up Google Cloud monitoring to alert you if VM goes down

## Accessing Your App

Once deployed:
- **Backend API**: http://YOUR_VM_IP:5000
- **Frontend**: Deploy separately or serve from same VM
- **GPS Tracker**: Will connect to YOUR_VM_IP:50100

## Next Steps

1. Set up automatic backups
2. Configure monitoring and alerts
3. Set up a domain name (optional)
4. Enable HTTPS with Let's Encrypt (optional)

## Troubleshooting

**Can't connect to GPS tracker:**
```powershell
# Check firewall rules
gcloud compute firewall-rules list | grep 50100

# Check VM is running
gcloud compute instances describe gov-tracker-vm --zone=us-central1-a

# Check logs
gcloud compute instances get-serial-port-output gov-tracker-vm --zone=us-central1-a
```

**Backend not responding:**
```powershell
# SSH into VM and check
gcloud compute ssh gov-tracker-vm --zone=us-central1-a

# Check if node is running
ps aux | grep node

# Check if ports are listening
sudo netstat -tlnp | grep -E '5000|50100'
```

## Quick Commands Reference

```powershell
# Start VM
gcloud compute instances start gov-tracker-vm --zone=us-central1-a

# Stop VM (to save costs when not in use)
gcloud compute instances stop gov-tracker-vm --zone=us-central1-a

# SSH into VM
gcloud compute ssh gov-tracker-vm --zone=us-central1-a

# View VM logs
gcloud compute instances get-serial-port-output gov-tracker-vm --zone=us-central1-a

# Delete everything (careful!)
gcloud compute instances delete gov-tracker-vm --zone=us-central1-a
```

That's it! Your app is now deployed and your GPS tracker can connect via your public IP.
