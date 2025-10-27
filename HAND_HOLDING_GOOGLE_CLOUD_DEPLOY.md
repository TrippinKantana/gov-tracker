# Complete Google Cloud Deployment Walkthrough
## Step-by-Step Guide for Your Government Asset Tracking Platform

**Follow this guide exactly step-by-step. Each section builds on the previous one.**

---

## Part 1: Install and Setup (15 minutes)

### Step 1.1: Install Google Cloud SDK

1. **Go to:** https://cloud.google.com/sdk/docs/install
2. **Choose:** Windows (Installer)
3. **Download and run** the installer
4. **Accept all defaults** during installation
5. **Open PowerShell** (as Administrator)

### Step 1.2: Initialize Google Cloud

In PowerShell, run:

```powershell
# Login to Google Cloud
gcloud auth login

# Create a new project (replace with your own unique name)
gcloud projects create gov-asset-tracker-12345 --name="Gov Asset Tracker"

# Set as active project
gcloud config set project gov-asset-tracker-12345

# Enable billing (requires a Google account with credit card)
# Go to: https://console.cloud.google.com/billing
# Link billing account to your project
```

**Note:** You'll need to set up billing. Google gives $300 free credit for new accounts!

### Step 1.3: Enable Required Services

```powershell
gcloud services enable compute.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

Wait for both to show "Operation finished successfully"

---

## Part 2: Create Your Virtual Machine (10 minutes)

### Step 2.1: Create the VM

Your backend needs a VM because it uses port 50100 for GPS tracking:

```powershell
gcloud compute instances create gsa-tracker-vm `
    --zone=europe-west1-b `
    --machine-type=e2-medium `
    --image-family=ubuntu-2204-lts `
    --image-project=ubuntu-os-cloud `
    --boot-disk-size=30GB `
    --boot-disk-type=pd-standard
```

This creates a VM with 2 vCPU and 4GB RAM. Cost: ~$24/month

**Wait for it to finish** (takes 2-3 minutes)

### Step 2.2: Get Your Public IP

```powershell
gcloud compute instances describe gsa-tracker-vm --zone=europe-west1-b --format="value(networkInterfaces[0].accessConfigs[0].natIP)"
```

**Write this IP down!** You'll need it for your GPS tracker.

### Step 2.3: Create Firewall Rules

Allow connections on ports 5000 (API) and 50100 (GPS):

```bash
# Allow API access (use backslash for line continuation in bash)
gcloud compute firewall-rules create allow-backend-api \
    --allow tcp:5000 \
    --source-ranges 0.0.0.0/0 \
    --description "Backend API on port 5000"

# Allow GPS tracker connections
gcloud compute firewall-rules create allow-gps-tracker \
    --allow tcp:50100 \
    --source-ranges 0.0.0.0/0 \
    --description "GPS tracker on port 50100"

# Allow SSH (for setup)
gcloud compute firewall-rules create allow-ssh \
    --allow tcp:22 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow SSH access"
```

**For PowerShell (if using locally on Windows):**
```powershell
gcloud compute firewall-rules create allow-backend-api `
    --allow tcp:5000 `
    --source-ranges 0.0.0.0/0 `
    --description "Backend API on port 5000"
```

---

## Part 3: Transfer Your Code to the VM (10 minutes)

### Step 3.1: Copy Your Backend to VM

**Method 1: Using gcloud (Recommended)**

First, create a ZIP file of your backend:

```powershell
# Navigate to your project root
cd "C:\Users\cyrus\Desktop\gov tracker"

# Create zip of backend folder
Compress-Archive -Path "backend" -DestinationPath "backend.zip" -Force
```

**Choose ONE of these methods to upload:**

**Method 1: Using Git (Recommended if your code is in GitHub)**

**Option A: Using Personal Access Token**

1. Get a token from: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Check "repo" permission
4. Generate and copy the token

Then in Cloud Shell:
```bash
gcloud compute ssh gsa-tracker-vm --zone=europe-west1-b

# On the VM, clone with token:
git clone https://YOUR_TOKEN@github.com/TrippinKantana/gov-tracker.git
```

**Option B: Using SSH Keys (More Secure)**

```bash
gcloud compute ssh gsa-tracker-vm --zone=europe-west1-b

# Generate SSH key on VM
ssh-keygen -t ed25519 -C "vm-deploy" -f ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add this key to GitHub: Settings → SSH and GPG keys → New SSH key

# Then clone using SSH:
git clone git@github.com:TrippinKantana/gov-tracker.git
```

**Option C: Make Repository Public Temporarily**

If it's a private repo you don't want to add tokens to, make it public temporarily:
- Go to repository Settings → Danger Zone → Change visibility to Public
- Clone without authentication
- Make it private again after

**Method 2: Upload via Local Computer**

From your local Windows PowerShell:
```powershell
# Make sure you have gcloud installed locally
# Navigate to your project folder
cd "C:\Users\cyrus\Desktop\gov tracker"

# Create zip
Compress-Archive -Path "backend" -DestinationPath "backend.zip" -Force

# Upload to VM
gcloud compute scp backend.zip gsa-tracker-vm:~/ --zone=europe-west1-b
```

**Method 3: If SCP doesn't work, use this alternative:**

From Cloud Shell:
```bash
# First, zip your backend folder
gcloud compute ssh gsa-tracker-vm --zone=europe-west1-b
# Now you're on the VM

# Install Node.js and Git first
sudo apt-get update
sudo apt-get install -y git build-essential
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your code if it's in GitHub:
git clone https://github.com/YOUR_USERNAME/gov-tracker.git
cd gov-tracker/backend
```

**Method 4: Direct file creation (for testing)**

If you just need to test the GPS tracker functionality, you can create a minimal server directly on the VM.

### Step 3.2: Connect to VM and Setup

```powershell
# SSH into your VM
gcloud compute ssh gsa-tracker-vm --zone=europe-west1-b
```

**You're now inside the VM!** Commands from now on run on the VM:

```bash
# Update system
sudo apt-get update

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git build-essential

# Verify installation
node --version
npm --version

# Install dependencies (if not already installed)
npm install

# Create .env file
# Note: FRONTEND_URL is for CORS - update this to your actual frontend URL when deployed
cat > .env << EOF
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
EOF

# Install PM2 to keep server running
sudo npm install -g pm2

# Start your backend
pm2 start server.js --name gsa-tracker

# Make it start on boot
pm2 startup
pm2 save

# Check if it's running
pm2 logs gsa-tracker
```

Press `Ctrl+C` to exit logs, then:

```bash
# Check server is listening on ports
sudo netstat -tlnp | grep -E '5000|50100'

# You should see both ports listening!
```

**Note:** If you see errors about port 5000 already in use, edit the .env and change PORT to 5001.

### Step 3.3: Exit VM

Type `exit` or press `Ctrl+D` to return to your local PowerShell

---

## Part 4: Configure Your GPS Tracker (5 minutes)

### Step 4.1: Get Your Public IP

```powershell
# Get your public IP
gcloud compute instances describe gsa-tracker-vm --zone=europe-west1-b --format="value(networkInterfaces[0].accessConfigs[0].natIP)"
```

Write down this IP (e.g., `34.67.123.45`)

### Step 4.2: Get the Default Port

Check which port your API is actually listening on:

```powershell
# SSH back in
gcloud compute ssh gsa-tracker-vm --zone=europe-west1-b

# Check what port is listening
sudo netstat -tlnp | grep node

# Exit
exit
```

### Step 4.3: Send SMS to Your GPS Tracker

Send this SMS to your tracker's phone number:

```
#6666#APN,internet#
#6666#SERVER,35.241.151.113,50100,TCP#
#6666#TIMEZONE,0#
#6666#TIMER,30#
#6666#RESET#
```

**Replace `34.67.123.45` with YOUR actual public IP**

---

## Part 5: Verify Connection (5 minutes)

### Step 5.1: Check Server Logs

```powershell
# SSH into VM
gcloud compute ssh gsa-tracker-vm --zone=europe-west1-b

# View server logs
pm2 logs gsa-tracker --lines 50

# Look for these messages:
# 🔌 New GPS tracker connection: <ip>
# 🆕 New unregistered GPS device detected: <imei>
# 💓 Heartbeat from <imei>

# Exit logs
Press Ctrl+C
```

### Step 5.2: Test Your Backend API

Open a web browser and go to:

```
http://YOUR_PUBLIC_IP:5000/api/vehicles
```

Replace `YOUR_PUBLIC_IP` with your actual IP

You should see JSON data. If you get "Site can't be reached", check firewall rules.

### Step 5.3: Verify GPS Tracker Connection

Check if tracker is sending heartbeats:

```bash
# On the VM
pm2 logs gsa-tracker | grep "Heartbeat"
```

You should see heartbeat messages every 30 seconds.

---

## Part 6: Configure Frontend (Optional)

### Step 6.1: Update Frontend to Use Cloud IP

Edit `frontend/src/services/api.ts` or similar file:

```typescript
// Change from localhost to your public IP
const API_URL = 'http://YOUR_PUBLIC_IP:5000';
```

### Step 6.2: Deploy Frontend

Option 1: Build and serve from same VM

```powershell
gcloud compute ssh gsa-tracker-vm --zone=europe-west1-b

# Install nginx
sudo apt-get install -y nginx

# Build frontend (from your local machine)
cd frontend
npm run build

# Copy dist folder to VM (from local PowerShell)
gcloud compute scp --recurse dist/ gov-tracker-vm:~/backend/static --zone=us-central1-a

# On VM, configure nginx
sudo nano /etc/nginx/sites-available/default

# Change the root to:
# root /home/cyrus/backend/static;

# Restart nginx
sudo systemctl restart nginx
```

Option 2: Deploy to Vercel/Netlify (Easier)

1. Push your code to GitHub
2. Import to Vercel (vercel.com)
3. Deploy automatically
4. Update API_URL to your public IP

---

## Part 7: VM Management Commands

### Daily Operations

```powershell
# Start VM
gcloud compute instances start gsa-tracker-vm --zone=europe-west1-b

# Stop VM (to save money when not in use)
gcloud compute instances stop gsa-tracker-vm --zone=europe-west1-b

# Restart VM
gcloud compute instances reset gsa-tracker-vm --zone=europe-west1-b

# SSH into VM
gcloud compute ssh gsa-tracker-vm --zone=europe-west1-b

# View server logs
gcloud compute ssh gsa-tracker-vm --zone=europe-west1-b
pm2 logs gsa-tracker
```

### Check Costs

Visit: https://console.cloud.google.com/billing

### Update Your Code

```powershell
# On your local machine, make changes
# Re-zip and upload
Compress-Archive -Path "backend" -DestinationPath "backend.zip" -Force
gcloud compute scp backend.zip gsa-tracker-vm:~/ --zone=europe-west1-b

# SSH into VM
gcloud compute ssh gsa-tracker-vm --zone=europe-west1-b

# On VM
cd ~/backend
unzip -o ~/backend.zip
npm install
pm2 restart gsa-tracker
```

---

## Troubleshooting

### GPS Tracker Not Connecting

```powershell
# Check firewall rules
gcloud compute firewall-rules list | grep 50100

# Check VM is running
gcloud compute instances describe gsa-tracker-vm --zone=europe-west1-b --format="value(status)"

# Check server logs
gcloud compute ssh gsa-tracker-vm --zone=europe-west1-b
pm2 logs gsa-tracker

# Check if port is open
sudo netstat -tlnp | grep 50100
```

### Backend Not Starting

```powershell
# SSH into VM
gcloud compute ssh gsa-tracker-vm --zone=europe-west1-b

# Check PM2 status
pm2 status

# View logs
pm2 logs gsa-tracker --lines 100

# Check for port conflicts
sudo netstat -tlnp | grep 5000
sudo netstat -tlnp | grep 50100

# Restart server
pm2 restart gsa-tracker

# Check environment
cat ~/backend/.env
```

### Can't Access from Browser

```powershell
# Check firewall rules exist
gcloud compute firewall-rules list

# Test if server is running
gcloud compute ssh gsa-tracker-vm --zone=europe-west1-b
curl localhost:5000/api/vehicles

# If works locally but not externally, firewall issue
# Delete and recreate firewall rule
gcloud compute firewall-rules delete allow-backend-api
gcloud compute firewall-rules create allow-backend-api --allow tcp:5000 --source-ranges 0.0.0.0/0
```

### Out of Memory Issues

```powershell
# Check memory usage
gcloud compute ssh gsa-tracker-vm --zone=europe-west1-b
free -h

# If low on memory, upgrade VM
gcloud compute instances set-machine-type gsa-tracker-vm --machine-type=e2-large --zone=europe-west1-b
```

---

## Security Checklist

- [ ] Change default SSH keys
- [ ] Use strong database passwords
- [ ] Enable HTTPS (get SSL certificate)
- [ ] Restrict firewall to specific IPs if possible
- [ ] Enable automatic backups
- [ ] Set up monitoring alerts
- [ ] Use environment variables for secrets

---

## Cost Optimization

**Current Setup Cost:**
- VM (e2-medium, running 24/7): ~$24/month
- **Total: ~$24/month**

**To Reduce Costs:**

1. **Stop VM when not in use:**
   ```powershell
   gcloud compute instances stop gsa-tracker-vm --zone=europe-west1-b
   ```
   Then start when needed (GPS won't connect when stopped though)

2. **Use smaller VM (for testing):**
   ```powershell
   # Change to e2-small (~$6/month but slower)
   gcloud compute instances set-machine-type gsa-tracker-vm --machine-type=e2-small --zone=europe-west1-b
   ```

3. **Set up auto-shutdown for non-production hours**

---

## Next Steps

1. ✅ Your platform is deployed!
2. ✅ GPS tracker can connect
3. ✅ Access your app at: `http://YOUR_IP:5000`

**To complete setup:**
- Set up database (PostgreSQL)
- Configure email notifications
- Set up monitoring alerts
- Deploy frontend
- Get SSL certificate for HTTPS

**Questions?** Check the other docs:
- `SETUP_BW32_TRACKER.md` - GPS tracker setup
- `docs/DEPLOY_TO_CLOUD.md` - Alternative deployment methods
- `docs/GOOGLE_CLOUD_DEPLOYMENT.md` - Advanced topics

You're all set! 🎉
