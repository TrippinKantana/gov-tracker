# BW32 GPS Tracker - Complete Workflow Guide

## 📦 When You Receive Your BW32 GPS Tracker

### **Step 1: Physical Installation**
1. **Mount BW32 in vehicle** - Hide in dashboard or under seat
2. **Connect power** - Wire to 12V vehicle power (usually ignition switch)
3. **Install GPS antenna** - Place on roof or dashboard for clear sky view
4. **Insert SIM card** - Use data-enabled SIM with your cellular carrier
5. **Note the IMEI** - 15-digit number printed on device label

### **Step 2: Device Configuration (SMS)**
Send SMS commands to the BW32 device phone number:

```sms
APN,internet              # Replace with your carrier's APN
SERVER,your-ip,50100,TCP  # Replace 'your-ip' with your server IP
TIMEZONE,0                # UTC timezone
TIMER,30                  # Report every 30 seconds  
RESET                     # Restart device
```

**🔍 How to find your server IP:**
- If using cloud server: Use the public IP address
- If using local server: Use your public IP (check at whatismyip.com)

### **Step 3: Automatic Device Discovery**
Once configured, the BW32 will:
1. **Connect to your server** on port 50100
2. **Send heartbeat signals** every 30 seconds
3. **Appear automatically** in your platform's available GPS devices list

**✅ You'll see in server logs:**
```
🔌 New GPS tracker connection: <device-ip>
🆕 New unregistered GPS device detected: 123456789012345
💓 Heartbeat from 123456789012345
```

## 🖥️ Platform Workflow (After Device is Connected)

### **Step 4: Add Vehicle to Platform**
1. **Open Fleet Management** → Click "Add Government Fleet"
2. **Fill out vehicle form** → Complete all required fields
3. **Click "Add to Fleet"** → Vehicle is added to system

### **Step 5: Assign GPS to Vehicle**
1. **Open Fleet Details** → Click on your vehicle in the table
2. **Click "GPS Tracking" tab** → Switch to GPS tracking section
3. **Click "Assign GPS Device"** → Opens GPS device selection modal

### **Step 6: Select Your BW32 Device**
In the GPS assignment dialog, you'll see:

```
Available GPS Devices:
┌─────────────────────┬──────────┬─────────┬───────────┐
│ Device IMEI         │ Status   │ Battery │ Signal    │
├─────────────────────┼──────────┼─────────┼───────────┤
│ 123456789012345     │ Active   │ 85%     │ Strong    │
│ Unassigned GPS      │ Online   │ --      │ --        │
└─────────────────────┴──────────┴─────────┴───────────┘
```

4. **Select your device** → Click on the BW32 with your IMEI
5. **Click "Assign"** → Device becomes linked to vehicle
6. **Success!** → GPS is now assigned and tracking

### **Step 7: Real-time Tracking**
Once assigned, you'll see:
- **Live position updates** on the map
- **Real-time speed and direction** 
- **GPS signal status** and battery level
- **Movement history** and tracking trail

## 🎛️ GPS Tracking Interface

### **In Fleet Details → GPS Tracking Tab:**

**📊 Device Status:**
- **Device ID**: Your BW32 IMEI
- **Connection Status**: Online/Offline
- **Last Update**: Real-time timestamp
- **Battery Level**: Device battery percentage
- **GPS Signal**: Satellite count and signal quality

**🗺️ Live Tracking:**
- **Current Location**: Lat/Lng coordinates
- **Speed**: Real-time speed in km/h
- **Direction**: Compass heading
- **Track on Map**: Button to view on live map

**⚠️ Alerts & Alarms:**
- **SOS Button alerts**
- **Geofence violations**
- **Speed limit violations**
- **Power disconnection alerts**

## 🔄 Device Management

### **View All GPS Devices**
```javascript
GET /api/gps/devices
// Shows all BW32 devices (assigned and unassigned)
```

### **Check Device Status**
```javascript  
GET /api/gps/devices/:deviceId
// Shows specific device info and assignment
```

### **Get Real-time Position**
```javascript
GET /api/gps/position/:vehicleId  
// Gets latest GPS position for vehicle
```

## 🚨 Troubleshooting

### **Device Not Appearing in List**
1. **Check server logs** for connection messages
2. **Verify SMS configuration** - Ensure correct server IP and port
3. **Check firewall** - Port 50100 must be open
4. **SIM card data** - Ensure SIM has data plan

### **No Position Updates**
1. **GPS reception** - Device needs clear sky view
2. **Device assignment** - Ensure GPS is assigned to vehicle  
3. **Browser console** - Check for JavaScript errors
4. **Server logs** - Look for position parsing errors

### **Assignment Failed**
1. **Device already assigned** - Check if GPS is assigned to another vehicle
2. **Network error** - Verify server connectivity
3. **Device offline** - Ensure device is sending heartbeats

## 📍 Expected Real-time Experience

Once everything is working:

1. **Vehicle moves** → BW32 detects movement via GPS
2. **Data transmission** → Device sends position via cellular to your server:50100  
3. **Platform processes** → Server parses BW protocol and updates database
4. **Real-time update** → Frontend receives Socket.IO update
5. **Map updates** → Vehicle marker moves on map in real-time
6. **Fleet details update** → GPS tab shows live position data

The entire flow from vehicle movement to platform update happens in **under 30 seconds** (based on your TIMER setting).

## 🎯 Summary

**Physical Setup** → **SMS Configuration** → **Auto-Discovery** → **Vehicle Assignment** → **Real-time Tracking**

Your BW32 GPS trackers will integrate seamlessly with your government asset tracking platform, providing professional-grade real-time fleet monitoring!
