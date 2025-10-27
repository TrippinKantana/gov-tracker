# Setup Your BW32 GPS Tracker

## Quick Start Guide

Your BW32 GPS tracker will automatically appear in the system once it connects to the server.

### Step 1: Configure Your Tracker

1. **Insert SIM card** into the BW32 tracker
2. **Note the IMEI** - This is usually printed on the device label (15 digits)
3. **Send SMS commands** to configure the device:

#### SMS Commands to Send to Your Tracker's SIM Number:

Send ALL of these commands in ONE SMS message (multiple lines):

```
#6666#APN,internet#
#6666#SERVER,your-server-ip,50100,TCP#
#6666#TIMEZONE,0#
#6666#TIMER,30#
#6666#RESET#
```

**Replace `your-server-ip` with your actual server IP address (e.g., `10.84.36.44` for your local Wi-Fi IP).**

**Note:** The tracker will process all commands sequentially when you send them in one SMS. The RESET command at the end will restart the device with your new settings.

**How to find your server IP:**
- If running on localhost for testing: Use `localhost` or `127.0.0.1` (**Note:** `localhost` won't work from the tracker device unless it's on the same machine. For testing, use your computer's local network IP address like `192.168.1.x`)
- If running on a public server: Use the public IP address
- To find your local network IP on Windows: Run `ipconfig` in PowerShell and look for "IPv4 Address"
- To find your public IP: visit https://whatismyip.com

### Step 2: Open Firewall Port (Windows)

**IMPORTANT:** Before testing, you must allow incoming connections on port 50100.

Open **PowerShell as Administrator** and run:

```powershell
New-NetFirewallRule -DisplayName "GPS Tracker Port 50100" -Direction Inbound -Protocol TCP -LocalPort 50100 -Action Allow
```

**Or manually:**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter "50100" → Next
6. Select "Allow the connection" → Next
7. Check all profiles → Name it "GPS Tracker Port 50100" → Finish

### Step 3: Verify Connection

Once you send the SMS commands and the tracker restarts:

1. **Check server logs** - You will see NEW messages appear:
   ```
   🔌 New GPS tracker connection: <device-ip>
   🆕 New unregistered GPS device detected: <imei>
   💓 Heartbeat from <imei>
   ```

**Note:** The messages `🛰️ BW32 GPS Ingestor started on port 50100` and `📡 Waiting for GPS tracker connections...` mean your server is READY and waiting. The connection messages will only appear AFTER the tracker device connects.

### Step 4: Assign to Vehicle

1. **Open your application** in the browser
2. **Go to Fleet Management** and open a vehicle
3. **Click on "GPS Tracking" tab**
4. **Click "Assign GPS Device"**
5. **Your real BW32 device** will appear in the list with its IMEI
6. **Click "Assign"** to link it to the vehicle

### Step 5: Verify Tracking

You should now see:
- Live GPS position updates
- Real-time speed and direction
- Device status (Online/Offline)
- Last seen timestamp

## Troubleshooting

### Device Not Appearing in List

**Problem:** Device doesn't show up when you click "Assign GPS Device"

**Solutions:**
1. Check that the backend server is running on port 5000
2. Check that BW32 ingestor is listening on port 50100
3. Verify SMS configuration was sent correctly
4. Check device has cellular signal
5. Look at server logs for connection messages

**To check server logs:**
```bash
# Look for these messages:
🛰️ BW32 GPS Ingestor started on port 50100
🔌 New GPS tracker connection...
💓 Heartbeat from <imei>
```

### Device Shows Offline

**Problem:** Device appears but shows as "Offline"

**Solutions:**
1. Check device power - ensure it's receiving power
2. Check cellular signal - device needs good signal
3. Check device is in range of GPS satellites
4. Verify device is sending heartbeats (check server logs)

### No Position Updates

**Problem:** Device is connected but no GPS coordinates

**Solutions:**
1. Ensure device has clear view of sky for GPS
2. Check GPS antenna is properly connected
3. Wait 2-3 minutes for GPS to acquire satellites
4. Check server logs for position messages

## SMS Command Reference

Your BW32 tracker uses SMS commands with the password `6666` (default).

**Basic Format:**
```
#<password>#<command>#<parameter>#
```

**Common Commands:**
- `#6666#APN,internet#` - Set APN for cellular data
- `#6666#SERVER,ip,port,tcp#` - Set server address
- `#6666#TIMER,30#` - Report every 30 seconds
- `#6666#RESET#` - Restart device
- `#6666#GL#` - Get current location
- `#6666#STATUS#` - Get device status

**To Request Location:**
Send SMS to your tracker's SIM number:
```
1234
```
OR
```
#6666#GL#
```

The tracker will reply with a Google Maps link.

## Network Requirements

**Backend Server:**
- Must be accessible from the internet (for cellular networks)
- Port 50100 must be open for TCP connections
- Firewall must allow incoming connections on port 50100

**Important Network Consideration:**

Your tracker uses cellular network (SIM card), so it needs to reach your server over the internet. A local IP like `10.84.36.44` won't work from the cellular network.

**You have 3 options:**

1. **Use a public IP with port forwarding** (Best for production)
   - Get your public IP from https://whatismyip.com
   - Configure your router to forward port 50100 to `10.84.36.44`
   - Send SMS with your public IP

2. **Use a tunnel service** (Best for testing in office)
   - Install ngrok: `npm install -g ngrok`
   - Run: `ngrok tcp 50100`
   - Use the ngrok IP in your SMS command
   - Note: Free ngrok changes IP on restart

3. **Deploy to cloud server** (Best for production)
   - Use Google Cloud, AWS, Azure, DigitalOcean with public IP
   - **Quick setup:** See `docs/DEPLOY_TO_CLOUD.md` for step-by-step guide
   - **Full details:** See `docs/GOOGLE_CLOUD_DEPLOYMENT.md` for advanced setup

**For office testing without vehicle:**
- ✅ You CAN send SMS from office
- ✅ GPS will get a location (won't be accurate indoors)
- ❌ Cellular tracker can't reach your local IP `10.84.36.44`
- ⚠️ You need to use option 2 (ngrok) or option 1 (router port forwarding)

## Expected Behavior

Once configured and connected:

1. **Device connects** → Server logs connection
2. **Device sends heartbeat** → Every 30 seconds (or configured interval)
3. **Device appears in list** → As "Unassigned GPS <IMEI>"
4. **You assign to vehicle** → Device shows as "Assigned"
5. **Real-time tracking** → Position updates every 30 seconds

## Next Steps

After setup:
- Test by moving the vehicle
- Check real-time position updates
- Verify speed and direction data
- Test geofencing features
- Set up SOS button alerts

Your BW32 GPS tracker is now integrated with your Government Asset Tracker platform!
