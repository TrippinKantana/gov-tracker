# Live Map GPS Tracking

## Overview

Your vehicles equipped with BW32 GPS trackers are now tracked in real-time on the Live Map view. The system automatically receives GPS position updates and displays them on the map.

## How It Works

### 1. **Real-Time Updates**
When your BW32 tracker sends position data to the server:
- Server receives GPS coordinates via port 50100
- GPS handler processes the data
- Socket.IO broadcasts the position to all connected clients
- Live Map automatically updates vehicle marker position

### 2. **Visual Tracking**
- **Vehicle markers** show current GPS location
- **Click on vehicles** to see GPS tracking details
- **Marker moves** in real-time as the vehicle moves
- **Last update timestamp** shows when position was received

### 3. **GPS Device Status**
In the GPS Tracking tab, you can see:
- **Device status**: Online/Offline
- **Battery level**: Device battery percentage
- **Signal strength**: GPS signal quality
- **Last seen**: Time since last update

## Using Live Map Tracking

### Step 1: Open Live Map
1. Navigate to **Map View** or **Command Center**
2. The map shows all government assets with their locations

### Step 2: Identify GPS-Tracked Vehicles
Vehicles with GPS trackers are marked on the map with a truck icon.
- **GPS Tracked**: Green icon, shows real-time position
- **No GPS**: Gray icon, shows default location

### Step 3: View GPS Status
Click on any vehicle marker to see:
- **GPS Information**: Device ID, battery, signal
- **Real-time coordinates**: Current latitude/longitude  
- **Speed & Direction**: Current speed and heading
- **Last Update**: When position was last received

### Step 4: Track Movement
- Watch vehicle markers move in real-time
- GPS updates every 30 seconds (as configured)
- Historical tracking trail shows movement path

## Features

### ✅ Real-Time Position Updates
- GPS coordinates update every 30 seconds
- Smooth marker movement on map
- Accurate positioning data

### ✅ Vehicle Status Monitoring
- Online/offline status
- Battery level monitoring
- Signal strength indicator
- GPS validity status

### ✅ Alarm Notifications
- SOS button alerts
- Geofence violations
- Speed alerts
- Power disconnection alerts

### ✅ Command Center Integration
- All GPS-tracked vehicles visible on one map
- Filter by department, status, or type
- Search and zoom to specific vehicles
- Full screen mode for monitoring

## Technical Details

### Socket.IO Events

The system uses these Socket.IO events for real-time updates:

```javascript
// Position updates
socket.on('gps:position', (data) => {
  // data contains: vehicleId, latitude, longitude, speed, course, timestamp
});

// Alarm notifications  
socket.on('gps:alarm', (alarm) => {
  // alarm contains: vehicleId, alarmType, message, timestamp
});

// Heartbeat status
socket.on('gps:heartbeat', (data) => {
  // data contains: deviceId, vehicleId, timestamp
});
```

### Data Flow

```
BW32 GPS Tracker
  ↓ (TCP Socket :50100)
Backend GPS Handler
  ↓ (Process & Store)
Socket.IO Server
  ↓ (Emit Events)
Frontend Live Map
  ↓ (Update Markers)
User Sees Real-Time Location
```

## Troubleshooting

### Vehicle Not Showing on Map

**Problem:** Vehicle has GPS tracker but not appearing on map

**Solutions:**
1. Check vehicle has GPS tracker assigned in vehicle details
2. Verify tracker is online (check GPS Tracking tab)
3. Check server logs for GPS data reception
4. Refresh the map view

### No Position Updates

**Problem:** Vehicle is on map but position isn't updating

**Solutions:**
1. Check GPS device is online and sending data
2. Verify Socket.IO connection (check browser console)
3. Check that backend is running and GPS ingestor is active
4. Ensure device has GPS signal (indoor devices may not get GPS)

### Offline Status

**Problem:** GPS device shows as "Offline"

**Solutions:**
1. Check device power connection
2. Verify cellular signal strength
3. Check SIM card has data plan
4. Restart GPS tracker device

## Best Practices

1. **Monitor Regularly**: Check GPS tracker status daily
2. **Verify Signal**: Ensure good GPS and cellular coverage
3. **Battery Check**: Monitor device battery levels
4. **Test Alerts**: Verify alarm notifications work
5. **Update Firmware**: Keep GPS tracker firmware updated

## Next Steps

- Set up geofencing for restricted areas
- Configure speed limit alerts
- Enable SOS button monitoring
- Set up historical tracking reports

Your government fleet now has professional-grade real-time GPS tracking integrated with the Live Map!

