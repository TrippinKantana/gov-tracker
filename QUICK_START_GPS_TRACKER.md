# Quick Start: Connect Your GPS Tracker

## Your Current Situation

✅ **Backend server running** on `localhost:5000` and port `50100`  
✅ **Server is ready** and waiting for GPS connections  
⚠️ **GPS tracker needs** a public IP to connect from cellular network  
❌ Your local IP `10.84.36.44` won't work from cellular network

## Your Options

### Option 1: Quick Test with Ngrok (Free, 2 minutes)

**Best for:** Testing if your tracker works before setting up cloud

```powershell
# Install ngrok
npm install -g ngrok

# Create tunnel for GPS port
ngrok tcp 50100

# You'll get something like: 0.tcp.ngrok.io:12345
```

Then send SMS to your tracker:
```
#6666#APN,internet#
#6666#SERVER,0.tcp.ngrok.io,12345,TCP#
#6666#TIMEZONE,0#
#6666#TIMER,30#
#6666#RESET#
```

**Note:** Free ngrok changes IP when you restart. Not for production.

### Option 2: Deploy to Google Cloud (Recommended for Production)

**Best for:** Production use, 24/7 tracking

Cost: ~$25-30/month  
Time: ~30 minutes

**Quick Steps:**

1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. Follow `docs/DEPLOY_TO_CLOUD.md` for step-by-step instructions
3. You'll get a public IP for your GPS tracker
4. Send SMS to tracker with the new public IP

### Option 3: Router Port Forwarding (Free, works from home)

**Best for:** If you have access to your router

**Steps:**

1. Login to your router admin (usually 192.168.1.1)
2. Go to "Port Forwarding" or "Virtual Servers"
3. Forward port 50100 to 10.84.36.44
4. Get your public IP from https://whatismyip.com
5. Send SMS with your public IP

**But wait!** Your router might have a dynamic IP that changes. Check if you have a static IP from your ISP.

## What You Should Do Right Now

**If you want to test immediately:**

→ Use **Option 1 (ngrok)** - it's the fastest way to verify everything works

**Commands:**
```powershell
# Terminal 1: Keep your backend running
# (It's already running ✓)

# Terminal 2: Install ngrok and create tunnel
npm install -g ngrok
ngrok tcp 50100

# Terminal 3: Copy the IP from ngrok output
# It will say: "Forwarding  tcp://0.tcp.ngrok.io:12345"
#              Use: 0.tcp.ngrok.io as IP, 12345 as port in SMS
```

**If you want to deploy for production:**

→ Use **Option 2 (Google Cloud)** - follow the guide in `docs/DEPLOY_TO_CLOUD.md`

## SMS Command Template

Once you have your public IP, send this SMS to your tracker:

```
#6666#APN,internet#
#6666#SERVER,YOUR_PUBLIC_IP,50100,TCP#
#6666#TIMEZONE,0#
#6666#TIMER,30#
#6666#RESET#
```

**Replace `YOUR_PUBLIC_IP` with:**
- For ngrok: The hostname (e.g., `0.tcp.ngrok.io`)
- For Google Cloud: The VM's public IP (e.g., `123.456.789.0`)
- For port forwarding: Your router's public IP

**Note:** The port might be different for ngrok (you'll see it in ngrok output).

## What Happens After You Send the SMS

1. **Tracker receives SMS** and processes commands
2. **Tracker restarts** (takes ~30 seconds)
3. **Tracker connects** to your server on port 50100
4. **Your server logs** will show:
   ```
   🔌 New GPS tracker connection: <ip>
   🆕 New unregistered GPS device detected: <imei>
   💓 Heartbeat from <imei>
   ```
5. **Device appears** in your app as "Unassigned GPS <IMEI>"
6. **Assign to vehicle** in your Fleet Management section

## Troubleshooting

**Don't see connection messages?**
- Check firewall: `gcloud compute firewall-rules list | grep 50100`
- For ngrok: Make sure it's running in a separate terminal
- Check server is still running on port 50100

**Tracker not responding?**
- Send test SMS: `#6666#STATUS#` (should reply with device info)
- Check SIM card has data plan
- Check cellular signal strength

**Getting errors?**
- Make sure backend is running: `npm run dev` in backend folder
- Check port 50100 is not blocked by Windows Firewall
- See troubleshooting section in `SETUP_BW32_TRACKER.md`

## Recommended Path

1. ✅ **Test with ngrok first** (5 minutes) - verify everything works
2. ✅ **Deploy to Google Cloud** (30 minutes) - for production use
3. ✅ **Configure GPS tracker** with public IP from Google Cloud
4. ✅ **Start tracking vehicles!**

## Getting Help

- **Setup questions:** See `SETUP_BW32_TRACKER.md`
- **Deployment questions:** See `docs/DEPLOY_TO_CLOUD.md`
- **Advanced setup:** See `docs/GOOGLE_CLOUD_DEPLOYMENT.md`

Good luck! 🚗🛰️
