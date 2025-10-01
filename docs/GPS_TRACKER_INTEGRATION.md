# BW32 GPS Tracker Integration Guide
## Government Asset Tracking System - Liberia GSA

### 🛰️ **Hardware Setup**

#### **BW32 GPS Tracker Specifications**
- **Model**: Benway BW32 Mini GPS Tracker
- **Connectivity**: 2G/4G GSM (850/900/1800/1900 MHz)
- **Accuracy**: 5-10 meters GPS precision
- **Power**: 9-40V vehicle power, 55mAh backup battery
- **Features**: Real-time tracking, SOS alerts, remote engine cutoff

#### **Physical Installation**
1. **Connect to vehicle power** (12V/24V)
2. **Install GPS antenna** on vehicle roof/dashboard
3. **Connect ignition wire** for ACC detection
4. **Install SIM card** with government data plan
5. **Test device** with SMS: "STATUS#"

### 📡 **Network Configuration**

#### **Server Setup**
```bash
# Backend server configuration
PORT=5000                    # Main API server
BW32_TCP_PORT=8841          # BW32 data reception
WEBSOCKET_PORT=8842         # Real-time client updates

# Configure device to send data to server
SMS Command: "SERVER#[YOUR_SERVER_IP]#8841#"
```

#### **Data Flow Architecture**
```
BW32 Tracker → 2G/4G Network → Server:8841 → Database → WebSocket:8842 → Frontend
```

### 🔄 **Real-Time Tracking Implementation**

#### **1. Backend Integration**
```javascript
// hardware/bw32-integration.ts
const bw32Integration = new BW32Integration(8841);

bw32Integration.on('locationUpdate', (data) => {
  // Store in database
  storeLocationData(data);
  
  // Broadcast to connected clients
  io.emit('vehicleLocationUpdate', {
    vehicleId: data.vehicleId,
    location: { lat: data.latitude, lng: data.longitude },
    speed: data.speed,
    timestamp: data.timestamp
  });
});
```

#### **2. Frontend Real-Time Updates**
```javascript
// Connect to WebSocket for live updates
const socket = io('http://localhost:5000');

socket.on('vehicleLocationUpdate', (data) => {
  // Update vehicle position on map
  updateVehicleMarker(data.vehicleId, data.location);
  
  // Update vehicle details
  updateVehicleData(data);
});
```

### 🎛️ **Tracking Features Implementation**

#### **1. Real-Time Location Tracking**
- **30-second intervals** for active tracking
- **2-minute intervals** when parked
- **Immediate updates** during emergency
- **GPS coordinate precision** to 5-10 meters

#### **2. History Playback**
```javascript
// Get tracking history for date range
const history = await gpsTrackingService.getTrackingHistory(
  vehicleId, 
  startDate, 
  endDate
);

// Display route on map with timeline
showRoutePlayback(history.points);
```

#### **3. Mileage Statistics**
- **Daily distance** calculation
- **Fuel consumption** tracking  
- **Average speed** monitoring
- **Route efficiency** analysis

#### **4. Remote Engine Cutoff**
```javascript
// Emergency stop
await gpsTrackingService.emergencyStop(vehicleId, trackerId);

// Restore engine
await gpsTrackingService.restoreEngine(vehicleId, trackerId);
```

#### **5. Alarm & Notification System**
- **SOS Emergency** → Immediate alert to security
- **Geo-fence violation** → Area boundary alerts
- **Over-speed detection** → Speed limit enforcement
- **Unauthorized movement** → After-hours activity
- **Low battery** → Tracker maintenance alerts

#### **6. Geo-Fencing**
```javascript
// Set authorized area boundary
await gpsTrackingService.setGeoFence(trackerId, {
  center: [longitude, latitude],
  radius: 5000 // meters
});
```

#### **7. ACC Ignition Detection**
- **Engine start/stop** monitoring
- **Unauthorized usage** detection
- **Operating hours** tracking
- **Idle time** calculation

#### **8. Over-Speed Detection**
- **Government speed limits** (80 km/h general, 50 km/h urban)
- **Automatic alerts** to fleet managers
- **Speed history** logging
- **Driver behavior** monitoring

### 🔧 **Integration Steps**

#### **Step 1: Configure BW32 Device**
```sms
# Send to tracker phone number
SERVER#[YOUR_SERVER_IP]#8841#
APN#internet#
INTERVAL#30#
ADMIN#[ADMIN_PHONE]#
```

#### **Step 2: Start Backend Services**
```bash
cd backend
npm run dev  # Starts main server and BW32 integration
```

#### **Step 3: Initialize Frontend Tracking**
```javascript
// In vehicle component
useEffect(() => {
  gpsTrackingService.initializeTracking();
}, []);
```

#### **Step 4: Test Connection**
1. **Check backend logs** for BW32 connections
2. **Verify WebSocket** connection in browser console
3. **Test emergency stop** command
4. **Validate location updates** on map

### 🛡️ **Security & Compliance**

#### **Government Security Features**
- **Encrypted communications** (SSL/TLS)
- **Authentication required** for remote commands
- **Audit logging** of all tracking activities
- **Emergency override** capabilities
- **Data retention** for investigations

#### **Access Control Levels**
- **Admin**: Full remote control, emergency stop
- **Official**: View tracking, alerts, history
- **Operator**: Basic tracking and monitoring
- **Viewer**: Read-only access to location data

### 📊 **Monitoring Dashboard**

#### **Real-Time Display**
- **Vehicle positions** on Live Map
- **Speed and direction** indicators
- **Geo-fence status** visualization
- **Alert notifications** panel
- **Fleet overview** statistics

#### **Historical Analysis**
- **Route playback** with timeline
- **Mileage reports** by date range
- **Fuel efficiency** analysis
- **Driver behavior** reports
- **Security incident** tracking

### 🚨 **Emergency Procedures**

#### **SOS Emergency Response**
1. **Automatic alert** to security operations center
2. **Live tracking** activation (10-second intervals)
3. **Emergency services** notification
4. **Supervisor alert** via SMS/email
5. **Incident logging** for follow-up

#### **Vehicle Recovery**
1. **Theft detection** (unauthorized movement)
2. **Remote engine cutoff** activation
3. **Continuous tracking** until recovery
4. **Law enforcement** coordination
5. **Asset recovery** procedures

### 📋 **Maintenance & Troubleshooting**

#### **Common Issues**
- **No GPS signal** → Check antenna connection
- **Device offline** → Verify SIM card data plan
- **Commands not working** → Check server connectivity
- **Battery low** → Schedule device maintenance

#### **Diagnostic Commands**
```sms
STATUS#          # Get device status
SIGNAL#          # Check GSM signal strength
GPS#             # Get current GPS coordinates
RESET#           # Restart device
```

This comprehensive GPS tracking system provides government-grade fleet monitoring with real-time capabilities and security features.
