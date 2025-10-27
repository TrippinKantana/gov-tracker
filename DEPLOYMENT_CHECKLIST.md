# Deployment Checklist
## Complete this in order, one step at a time

Print this page or keep it open while deploying.

---

## Pre-Deployment Setup

- [ ] Google Cloud account created
- [ ] Credit card added for billing ($300 free credit available)
- [ ] Google Cloud SDK installed on Windows
- [ ] Billing account linked to project

---

## Part 1: Installation (10 minutes)

- [ ] Opened PowerShell as Administrator
- [ ] Run: `gcloud auth login`
- [ ] Run: `gcloud projects create gov-asset-tracker-[YOUR_NUMBER]`
- [ ] Run: `gcloud config set project gov-asset-tracker-[YOUR_NUMBER]`
- [ ] Set up billing at: https://console.cloud.google.com/billing
- [ ] Enabled services: compute, cloudbuild

**Notes:**
- Replace `[YOUR_NUMBER]` with any numbers (e.g., `gov-asset-tracker-12345`)
- Project names must be globally unique
- Free tier: $300 credit for 90 days

---

## Part 2: Create VM (5 minutes)

- [ ] Run: VM creation command
- [ ] Wait for "Done" message
- [ ] Copied public IP address: ____________________
- [ ] Created firewall rule for port 5000
- [ ] Created firewall rule for port 50100
- [ ] Created firewall rule for port 22 (SSH)

**VM Name:** `gov-tracker-vm`  
**Zone:** `us-central1-a`  
**Your Public IP:** ____________________

---

## Part 3: Transfer Code (10 minutes)

- [ ] Created ZIP file: `backend.zip`
- [ ] Uploaded to VM
- [ ] SSH'd into VM: `gcloud compute ssh gov-tracker-vm`
- [ ] Installed Node.js (version 18+)
- [ ] Unzipped backend.zip
- [ ] Ran: `npm install` (completed without errors)
- [ ] Created `.env` file with PORT=5000
- [ ] Installed PM2: `sudo npm install -g pm2`
- [ ] Started server: `pm2 start server.js`
- [ ] Confirmed both ports listening: 5000 and 50100

**Check port status:** `sudo netstat -tlnp | grep -E '5000|50100'`

---

## Part 4: Test Backend (5 minutes)

- [ ] Opened browser to: `http://[YOUR_IP]:5000/api/vehicles`
- [ ] Saw JSON data (not error page)
- [ ] Can see API is responding

**Your Backend URL:** http://____________________:5000

---

## Part 5: Configure GPS Tracker (5 minutes)

- [ ] Got tracker's phone number/SIM number
- [ ] Created SMS with correct IP: ____________________
- [ ] Sent SMS with all 5 commands
- [ ] Tracker replied or restarted
- [ ] Waited 30-60 seconds

**SMS Sent:**
```
#6666#APN,internet#
#6666#SERVER,[YOUR_IP],50100,TCP#
#6666#TIMEZONE,0#
#6666#TIMER,30#
#6666#RESET#
```

---

## Part 6: Verify GPS Connection (5 minutes)

- [ ] SSH'd back into VM
- [ ] Checked logs: `pm2 logs gov-tracker`
- [ ] Saw: "🔌 New GPS tracker connection"
- [ ] Saw: "🆕 New unregistered GPS device detected"
- [ ] Saw: "💓 Heartbeat" messages
- [ ] App shows device in GPS device list

**IMEI Detected:** ____________________

---

## Part 7: Optional - Frontend Setup

- [ ] Decided on frontend deployment method
- [ ] Method 1: Deploy to same VM with nginx
- [ ] Method 2: Deploy to Vercel/Netlify
- [ ] Updated API URL in frontend config
- [ ] Tested frontend can connect to backend
- [ ] Frontend is accessible via browser

**Frontend URL:** ____________________

---

## Troubleshooting Log

**Issue 1:** ______________________________________________  
**Solution:** ______________________________________________  

**Issue 2:** ______________________________________________  
**Solution:** ______________________________________________  

---

## Final Verification

- [ ] Backend accessible from internet
- [ ] GPS tracker connecting and sending data
- [ ] Can see tracker in web interface
- [ ] Can assign tracker to vehicle
- [ ] Can see real-time GPS position updates
- [ ] Alerts working (heartbeat, offline detection)
- [ ] Server stays running after VM restart

---

## Notes & Reminders

**Important IPs:**
- Public IP: ____________________
- VM Zone: us-central1-a
- Backend Port: 5000
- GPS Port: 50100

**Monthly Cost:** ~$24

**Backup Plan:**
- Code saved on VM: ~/backend
- Backup strategy: ____________________

---

## Deployment Complete!

**Date Completed:** ____________________  
**Time Taken:** ____________________  
**Next Steps:** ____________________

**Congratulations! Your Government Asset Tracking Platform is live!** 🎉
