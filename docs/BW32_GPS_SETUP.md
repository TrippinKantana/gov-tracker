# BW32 GPS Tracker Integration Setup

## Overview

The BW32 GPS trackers use **TCP socket communication** with the Benway BW ASCII protocol instead of REST APIs. This document explains how to configure and integrate the trackers with your government asset tracking platform.

## Architecture

```
BW32 GPS Tracker → [Cellular/4G] → Your Server:50100 → Node.js GPS Handler → Platform Database → Real-time Frontend
```

## Server Configuration

### 1. Firewall/Network Setup

**Open TCP Port 50100** on your server:
- **Firewall**: Allow incoming TCP connections on port 50100
- **Router/NAT**: Forward port 50100 to your server
- **Public IP**: Ensure your server has a public IP or domain name

### 2. BW32 Device Configuration (via SMS)

Send these SMS commands to configure each BW32 device:

```sms
APN,internet  # Replace with your cellular carrier's APN
SERVER,your-server-ip,50100,TCP
TIMEZONE,0  # Use UTC
TIMER,30  # Report every 30 seconds
RESET  # Reboot device to apply settings
```

**Replace `your-server-ip`** with your actual server IP address or domain name.

## GPS Device Registration

### 1. Register Device to Vehicle

```javascript
POST /api/gps/devices
{
  "deviceId": "123456789012345",  // IMEI from BW32 device
  "vehicleId": "VH001",           // Your vehicle ID
  "name": "Fleet GPS Tracker"
}
```

### 2. View Registered Devices

```javascript
GET /api/gps/devices
// Returns list of all registered GPS devices
```

## Real-time Tracking

### 1. Frontend Integration

Your `GPSTrackingControls` component automatically receives real-time updates via Socket.IO:

```javascript
// Automatically handled by existing Socket.IO connection
socket.on('gps:position', (data) => {
  // Real-time position updates
  console.log('Vehicle position:', data);
});

socket.on('gps:alarm', (alarm) => {
  // GPS alarms (SOS, geofence, etc.)
  console.log('GPS Alarm:', alarm);
});
```

### 2. Get Latest Position

```javascript
GET /api/gps/position/:vehicleId
// Returns latest GPS position for the vehicle
```

## Data Format

### Position Data Structure

```javascript
{
  "vehicleId": "VH001",
  "deviceId": "123456789012345",
  "latitude": 6.2907,
  "longitude": -10.7969,
  "speed": 45.5,           // km/h
  "course": 180,           // degrees
  "timestamp": "2024-01-15T10:30:00.000Z",
  "gpsValid": true,
  "satellites": 8,
  "altitude": 150          // meters
}
```

## BW32 Protocol Details

### Message Types

1. **LK (Heartbeat)**: `BW*123456789012345*0002*LK#`
   - Server responds: `ON`

2. **UD (Position)**: `BW*123456789012345*XXXX*UD,241015,103000,A,0613.7444,N,01047.8133,W,12.5,180,150#`
   - Date: YYMMDD (UTC)
   - Time: hhmmss (UTC)  
   - Validity: A=valid, V=invalid
   - Coordinates: DDMM.MMMM format
   - Speed: knots (converted to km/h)
   - Course: degrees

3. **AL (Alarm)**: Same as UD but triggered by SOS, geofence, etc.
   - Server responds: `AL,OK`

## Testing

### 1. Check GPS System Status

```bash
curl http://localhost:5000/api/gps/devices
```

### 2. Monitor GPS Connections

Check server logs for:
- `🛰️ BW32 GPS Ingestor started on port 50100`
- `🔌 New GPS tracker connection: <IP>:<PORT>`
- `📨 Message from <deviceId>: <command>`

### 3. Test Device Registration

```bash
curl -X POST http://localhost:5000/api/gps/devices \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"123456789012345","vehicleId":"VH001","name":"Test GPS"}'
```

## Troubleshooting

### Device Not Connecting
1. **Check firewall**: Ensure port 50100 is open
2. **Verify APN settings**: Correct cellular APN configuration
3. **Check server IP**: Ensure BW32 has correct server address
4. **Monitor logs**: Check for connection attempts in server logs

### No Position Data
1. **GPS signal**: Ensure device has GPS reception
2. **Device registration**: Verify device is registered to vehicle
3. **Protocol parsing**: Check logs for parsing errors

### Real-time Updates Not Working
1. **Socket.IO connection**: Verify frontend is connected
2. **Device online**: Check device heartbeat status
3. **Browser console**: Look for JavaScript errors

## Security Notes

- **Firewall**: Only open port 50100, keep other ports closed
- **Rate limiting**: Monitor for unusual traffic patterns
- **Device validation**: Only accept data from registered devices
- **IP allowlisting**: Consider restricting to cellular carrier IP ranges

## Next Steps

1. **Configure first BW32 device** with SMS commands
2. **Register device** via API to map to vehicle
3. **Test position updates** in your fleet tracking interface
4. **Scale up** by configuring additional devices

The integration is now ready! Your platform will automatically receive and process GPS data from BW32 trackers.
