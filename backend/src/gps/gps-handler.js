/**
 * GPS Data Handler
 * Integrates BW32 GPS tracker data with the main application
 */

class GPSHandler {
  constructor({ app, io }) {
    this.app = app;
    this.io = io;
    this.devices = new Map(); // Device registry: deviceId -> assetId mapping
    this.latestPositions = new Map(); // Cache latest positions for quick access
  }

  /**
   * Initialize GPS tracking endpoints and device management
   */
  init() {
    this.setupDeviceEndpoints();
    this.setupPositionEndpoints();
    console.log('🛰️ GPS Handler initialized');
  }

  /**
   * Setup device registration and management endpoints
   */
  setupDeviceEndpoints() {
    // Register GPS device to vehicle mapping
    this.app.post('/api/gps/devices', (req, res) => {
      const { deviceId, assetId, vehicleId, name } = req.body;
      
      if (!deviceId || !vehicleId) {
        return res.status(400).json({
          success: false,
          message: 'Device ID and Vehicle ID are required'
        });
      }

      // Store device mapping
      this.devices.set(deviceId, {
        assetId: assetId || vehicleId,
        vehicleId,
        name: name || `GPS-${deviceId}`,
        registeredAt: new Date().toISOString(),
        lastSeen: null
      });

      console.log(`📡 Registered GPS device ${deviceId} to vehicle ${vehicleId}`);
      
      res.json({
        success: true,
        device: this.devices.get(deviceId)
      });
    });

    // Get registered devices
    this.app.get('/api/gps/devices', (req, res) => {
      const devices = Array.from(this.devices.entries()).map(([deviceId, info]) => ({
        deviceId,
        ...info
      }));

      res.json({
        success: true,
        devices,
        total: devices.length
      });
    });

    // Get specific device info
    this.app.get('/api/gps/devices/:deviceId', (req, res) => {
      const { deviceId } = req.params;
      const device = this.devices.get(deviceId);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      res.json({
        success: true,
        device: { deviceId, ...device }
      });
    });

    // Remove device registration
    this.app.delete('/api/gps/devices/:deviceId', (req, res) => {
      const { deviceId } = req.params;
      const deleted = this.devices.delete(deviceId);

      res.json({
        success: deleted,
        message: deleted ? 'Device unregistered' : 'Device not found'
      });
    });
  }

  /**
   * Setup position data endpoints
   */
  setupPositionEndpoints() {
    // Get latest position for a vehicle
    this.app.get('/api/gps/position/:vehicleId', (req, res) => {
      const { vehicleId } = req.params;
      
      // Find device by vehicle ID
      let targetDeviceId = null;
      for (const [deviceId, info] of this.devices.entries()) {
        if (info.vehicleId === vehicleId) {
          targetDeviceId = deviceId;
          break;
        }
      }

      if (!targetDeviceId) {
        return res.status(404).json({
          success: false,
          message: 'No GPS device registered for this vehicle'
        });
      }

      const position = this.latestPositions.get(targetDeviceId);
      if (!position) {
        return res.status(404).json({
          success: false,
          message: 'No recent position data available'
        });
      }

      res.json({
        success: true,
        position
      });
    });

    // Get position history (placeholder for future database integration)
    this.app.get('/api/gps/history/:vehicleId', (req, res) => {
      const { vehicleId } = req.params;
      const { from, to, limit = 100 } = req.query;

      // TODO: Implement database query for position history
      res.json({
        success: true,
        positions: [],
        message: 'Position history not yet implemented - requires database setup'
      });
    });
  }

  /**
   * Process heartbeat from GPS tracker
   */
  handleHeartbeat(data) {
    const { deviceId, timestamp } = data;
    
    if (this.devices.has(deviceId)) {
      // Update last seen time
      this.devices.get(deviceId).lastSeen = timestamp;
      
      console.log(`💓 Heartbeat from ${deviceId}`);
      
      // Emit to real-time clients
      this.io.emit('gps:heartbeat', {
        deviceId,
        timestamp,
        vehicleId: this.devices.get(deviceId).vehicleId
      });
    } else {
      // Auto-register unassigned device for discovery
      console.log(`🆕 New unregistered GPS device detected: ${deviceId}`);
      this.devices.set(deviceId, {
        assetId: null,
        vehicleId: null,
        name: `Unassigned GPS ${deviceId}`,
        registeredAt: timestamp,
        lastSeen: timestamp,
        status: 'unassigned'
      });
      
      // Notify frontend of new device available for assignment
      this.io.emit('gps:new-device', {
        deviceId,
        name: `Unassigned GPS ${deviceId}`,
        timestamp
      });
    }
  }

  /**
   * Process position update from GPS tracker
   */
  handlePosition(position) {
    const { deviceId } = position;
    
    if (!this.devices.has(deviceId)) {
      console.warn(`⚠️ Position from unregistered device: ${deviceId}`);
      return;
    }

    const deviceInfo = this.devices.get(deviceId);
    const vehicleId = deviceInfo.vehicleId;

    // Update device last seen
    deviceInfo.lastSeen = position.timestamp;

    // Cache latest position
    this.latestPositions.set(deviceId, {
      ...position,
      vehicleId
    });

    console.log(`📍 Position update from ${deviceId} (Vehicle: ${vehicleId}): ${position.latitude}, ${position.longitude}`);

    // Emit to real-time clients subscribed to this vehicle
    this.io.emit('gps:position', {
      vehicleId,
      deviceId,
      latitude: position.latitude,
      longitude: position.longitude,
      speed: position.speedKph,
      course: position.courseDeg,
      timestamp: position.fixTimeUtc,
      gpsValid: position.gpsValid,
      satellites: position.satellites,
      altitude: position.altitude
    });

    // TODO: Persist to database
    // await this.savePosition(position);
  }

  /**
   * Process alarm from GPS tracker
   */
  handleAlarm(alarm) {
    const { deviceId } = alarm;
    
    if (!this.devices.has(deviceId)) {
      console.warn(`⚠️ Alarm from unregistered device: ${deviceId}`);
      return;
    }

    const deviceInfo = this.devices.get(deviceId);
    const vehicleId = deviceInfo.vehicleId;

    console.log(`🚨 ALARM from ${deviceId} (Vehicle: ${vehicleId}):`, alarm);

    // Emit alarm to real-time clients
    this.io.emit('gps:alarm', {
      vehicleId,
      deviceId,
      alarmType: 'gps_alarm',
      latitude: alarm.latitude,
      longitude: alarm.longitude,
      timestamp: alarm.fixTimeUtc,
      message: `GPS Alarm from vehicle ${vehicleId}`,
      severity: 'high'
    });

    // TODO: Store alarm in database and trigger notifications
  }

  /**
   * Get device status for vehicle
   */
  getDeviceStatus(vehicleId) {
    for (const [deviceId, info] of this.devices.entries()) {
      if (info.vehicleId === vehicleId) {
        const position = this.latestPositions.get(deviceId);
        return {
          deviceId,
          ...info,
          lastPosition: position,
          isOnline: this.isDeviceOnline(deviceId)
        };
      }
    }
    return null;
  }

  /**
   * Check if device is online (heartbeat within last 5 minutes)
   */
  isDeviceOnline(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device || !device.lastSeen) return false;
    
    const lastSeenTime = new Date(device.lastSeen);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return lastSeenTime > fiveMinutesAgo;
  }

  /**
   * Send command to GPS tracker (if supported)
   */
  sendCommand(deviceId, command) {
    // TODO: Implement command sending if BW32 supports server-to-device commands
    console.log(`📤 Command to ${deviceId}: ${command}`);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalDevices: this.devices.size,
      onlineDevices: Array.from(this.devices.keys()).filter(id => this.isDeviceOnline(id)).length,
      totalPositions: this.latestPositions.size,
      uptime: process.uptime()
    };
  }
}

module.exports = GPSHandler;
