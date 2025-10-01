# Government Asset Tracking Platform - Testing Guide

## Quick Start Testing

### 1. Install Dependencies

```bash
# Root level dependencies
npm install

# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
npm install

cd ..
```

### 2. Environment Setup

Create backend environment file:
```bash
# Copy environment template
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your configuration:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database (optional for initial testing)
DATABASE_URL=postgresql://username:password@localhost:5432/gov_asset_tracker

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Mapbox (required for maps)
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here

# Hardware integration (optional for initial testing)
BW32_PORT=8841
LORAWAN_NETWORK_SERVER_URL=https://your-lorawan-server.com
LORAWAN_APPLICATION_ID=your-app-id
LORAWAN_ACCESS_KEY=your-access-key
MQTT_BROKER_URL=mqtt://your-mqtt-broker.com
```

### 3. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# OR start individually:
# Backend only
npm run dev:backend

# Frontend only  
npm run dev:frontend
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Testing Features

### Dashboard Testing
1. Navigate to http://localhost:3000
2. View the dashboard with asset statistics
3. Check system status indicators
4. Verify recent activity feed

### Map Testing
1. Go to the "Live Map" section
2. Click the fullscreen button (↗️) to test full-screen mode
3. Click on asset markers to view popups
4. Test the asset legend and filtering

### Asset Management Testing
1. Visit the "Assets" section
2. Use search functionality
3. Test filters (type, status, department)
4. Verify asset table data display

## API Testing

### Test API Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Get assets
curl http://localhost:5000/api/assets

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Hardware status
curl http://localhost:5000/api/hardware/health
```

### Test Hardware Data Ingestion

```bash
# Test BW32 GPS location update
curl -X POST http://localhost:5000/api/hardware/bw32/location \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "BW32001",
    "timestamp": "2024-01-15T10:30:00Z",
    "latitude": 6.2907,
    "longitude": -10.7969,
    "speed": 45,
    "course": 180,
    "altitude": 100,
    "battery": 85,
    "acc": true,
    "gpsFixed": true
  }'

# Test LoRaWAN sensor data
curl -X POST http://localhost:5000/api/hardware/lorawan/uplink \
  -H "Content-Type: application/json" \
  -d '{
    "deviceEUI": "0123456789ABCDEF",
    "applicationEUI": "FEDCBA9876543210", 
    "timestamp": "2024-01-15T10:30:00Z",
    "payload": "01020304",
    "port": 1,
    "rssi": -65,
    "snr": 7.5,
    "spreadingFactor": 7,
    "frequency": 915.2,
    "gatewayInfo": []
  }'

# Test emergency alarm
curl -X POST http://localhost:5000/api/hardware/bw32/alarm \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "BW32001",
    "alarmType": 1,
    "alarmMessage": "SOS Emergency Alert",
    "timestamp": "2024-01-15T10:30:00Z",
    "latitude": 6.2907,
    "longitude": -10.7969,
    "battery": 75
  }'
```

## Frontend Component Testing

### Manual UI Testing Checklist

**Navigation:**
- [ ] Dashboard loads without errors
- [ ] Navigation between pages works
- [ ] Active page highlighting works
- [ ] Responsive design on mobile/tablet

**Dashboard:**
- [ ] Statistics cards display correctly
- [ ] Recent activity updates
- [ ] System status indicators work
- [ ] Real-time timestamp updates

**Map View:**
- [ ] Map loads with Mapbox tiles
- [ ] Asset markers appear correctly
- [ ] Marker clicks show popups
- [ ] Fullscreen mode works
- [ ] Asset legend displays
- [ ] Clustering works for multiple assets

**Assets Page:**
- [ ] Asset table loads with data
- [ ] Search functionality works
- [ ] Filters apply correctly
- [ ] Table sorting works
- [ ] Action buttons respond

## Running Automated Tests

```bash
# Run all tests
npm test

# Run frontend tests
npm run test:frontend

# Run backend tests  
npm run test:backend

# Run with coverage
npm test -- --coverage
```

## Build Testing

```bash
# Test production build
npm run build

# Test TypeScript compilation
npm run type-check

# Test linting
npm run lint
```

## Hardware Integration Testing

### Mock Hardware Data

For testing without physical hardware, the application includes:

1. **Mock Asset Data**: Predefined vehicles, facilities, and devices
2. **Simulated GPS Coordinates**: Monrovia, Liberia locations
3. **Sample Alerts**: Battery warnings, maintenance notices
4. **Demo Tracking History**: Historical location data

### Testing Real Hardware Integration

**BW32 GPS Tracker:**
1. Connect BW32 device to network
2. Configure device to send data to your server IP:8841
3. Monitor backend console for connection messages
4. Test SOS button and track location updates

**LoRaWAN Sensors:**
1. Set up LoRaWAN gateway and network server
2. Register devices in your LoRaWAN network
3. Configure MQTT broker connection
4. Send test uplink messages

**Bluetooth Devices:**
1. Enable Bluetooth on server machine
2. Place Bluetooth beacons nearby
3. Check console for device discovery logs
4. Test proximity detection

## Performance Testing

### Load Testing
```bash
# Install load testing tool
npm install -g artillery

# Test API endpoints
artillery quick --count 10 --num 100 http://localhost:5000/health

# Test with custom scenarios
artillery run artillery-config.yml
```

### Browser Performance
1. Open Chrome DevTools
2. Run Lighthouse audit on http://localhost:3000
3. Check Performance, Accessibility, and Best Practices scores
4. Monitor Network tab for API call performance

## Troubleshooting

### Common Issues

**Frontend won't start:**
- Check Node.js version (16+ required)
- Clear node_modules and reinstall
- Check for port conflicts on 3000

**Backend API errors:**
- Verify environment variables
- Check for port conflicts on 5000  
- Review backend console logs

**Map not loading:**
- Verify Mapbox access token is valid
- Check browser console for errors
- Ensure token has proper permissions

**Hardware not connecting:**
- Check firewall settings for ports 8841 (BW32)
- Verify MQTT broker connectivity
- Test with hardware simulators first

### Debug Mode

Enable debug logging:
```bash
# Backend debug mode
DEBUG=* npm run dev:backend

# Frontend debug mode  
REACT_APP_DEBUG=true npm run dev:frontend
```

### Database Testing (Optional)

If you want to test with a real database:

```bash
# Install PostgreSQL and PostGIS
# Create database and user
# Run schema creation
psql -h localhost -U tracker_user -d gov_asset_tracker -f database/schema.sql

# Verify setup
psql -h localhost -U tracker_user -d gov_asset_tracker -c "\dt"
```

## Expected Test Results

### Successful Startup
```
✅ Frontend running on http://localhost:3000
✅ Backend API running on http://localhost:5000  
✅ Hardware integration ports listening
✅ Socket.IO server ready for real-time updates
```

### Working Features
- Dashboard displays asset statistics
- Map shows asset markers in Monrovia, Liberia
- Asset management table with search/filter
- API endpoints respond with mock data
- Real-time updates via WebSocket

The application is designed to work immediately with mock data, so you can test all features without requiring actual hardware or database setup initially.
