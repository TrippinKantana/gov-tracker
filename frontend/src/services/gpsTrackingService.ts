/**
 * BW32 GPS Tracker Integration Service
 * Connects to government vehicle tracking system
 */

export interface GPSTrackerData {
  deviceId: string;
  vehicleId: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  heading: number; // degrees
  altitude: number; // meters
  accuracy: number; // meters
  batteryLevel: number; // percentage
  gsmSignal: number; // signal strength
  ignitionStatus: boolean; // ACC detection
  engineStatus: boolean;
  fuelLevel?: number;
  mileage: number;
  geoFenceStatus: 'inside' | 'outside' | 'unknown';
  alarms: string[]; // Active alarms
}

export interface GPSCommand {
  deviceId: string;
  command: 'engine_cutoff' | 'engine_restore' | 'get_location' | 'set_geofence' | 'request_sos';
  parameters?: Record<string, any>;
}

export interface TrackingHistory {
  deviceId: string;
  startTime: Date;
  endTime: Date;
  points: GPSTrackerData[];
  totalDistance: number;
  maxSpeed: number;
  avgSpeed: number;
  stoppedDuration: number; // minutes
  movingDuration: number; // minutes
}

class GPSTrackingService {
  private wsConnection: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  // Initialize WebSocket connection for real-time tracking
  async initializeTracking(): Promise<boolean> {
    try {
      console.log('🛰️ Initializing BW32 GPS tracking connection...');
      
      // Connect to WebSocket for real-time GPS data
      this.wsConnection = new WebSocket('ws://localhost:8841/gps-tracking');
      
      this.wsConnection.onopen = () => {
        console.log('✅ GPS tracking WebSocket connected');
        this.reconnectAttempts = 0;
      };
      
      this.wsConnection.onmessage = (event) => {
        try {
          const gpsData: GPSTrackerData = JSON.parse(event.data);
          this.handleGPSData(gpsData);
        } catch (error) {
          console.error('Error parsing GPS data:', error);
        }
      };
      
      this.wsConnection.onclose = () => {
        console.warn('GPS tracking connection closed - attempting reconnect...');
        this.attemptReconnect();
      };
      
      this.wsConnection.onerror = (error) => {
        console.error('GPS tracking WebSocket error:', error);
      };
      
      return true;
    } catch (error) {
      console.error('Failed to initialize GPS tracking:', error);
      return false;
    }
  }
  
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting GPS tracking (attempt ${this.reconnectAttempts})...`);
      setTimeout(() => {
        this.initializeTracking();
      }, 5000 * this.reconnectAttempts); // Exponential backoff
    }
  }
  
  private handleGPSData(gpsData: GPSTrackerData) {
    console.log('📡 Real-time GPS data received:', gpsData);
    
    // Emit custom event for components to listen
    window.dispatchEvent(new CustomEvent('gpsDataReceived', { 
      detail: gpsData 
    }));
    
    // Check for alerts
    this.checkForAlerts(gpsData);
  }
  
  private checkForAlerts(gpsData: GPSTrackerData) {
    const alerts = [];
    
    // Over-speed detection
    if (gpsData.speed > 100) { // 100 km/h limit for government vehicles
      alerts.push({
        type: 'overspeed',
        message: `Vehicle ${gpsData.vehicleId} exceeding speed limit: ${gpsData.speed} km/h`,
        severity: 'high'
      });
    }
    
    // Geo-fence violations
    if (gpsData.geoFenceStatus === 'outside') {
      alerts.push({
        type: 'geofence',
        message: `Vehicle ${gpsData.vehicleId} has left authorized area`,
        severity: 'critical'
      });
    }
    
    // Low battery alert
    if (gpsData.batteryLevel < 20) {
      alerts.push({
        type: 'battery',
        message: `GPS tracker ${gpsData.deviceId} low battery: ${gpsData.batteryLevel}%`,
        severity: 'medium'
      });
    }
    
    // Emergency SOS
    if (gpsData.alarms.includes('SOS')) {
      alerts.push({
        type: 'emergency',
        message: `🚨 EMERGENCY SOS activated on vehicle ${gpsData.vehicleId}`,
        severity: 'emergency'
      });
    }
    
    // Emit alerts
    if (alerts.length > 0) {
      window.dispatchEvent(new CustomEvent('gpsAlertsReceived', { 
        detail: alerts 
      }));
    }
  }
  
  // Send command to GPS tracker
  async sendCommand(command: GPSCommand): Promise<boolean> {
    try {
      console.log(`📤 Sending GPS command: ${command.command} to ${command.deviceId}`);
      
      const response = await fetch('/api/hardware/bw32/command/' + command.deviceId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: command.command,
          parameters: command.parameters || {}
        })
      });
      
      const result = await response.json();
      return response.ok && result.success;
    } catch (error) {
      console.error('Error sending GPS command:', error);
      return false;
    }
  }
  
  // Get tracking history for a vehicle
  async getTrackingHistory(vehicleId: string, startDate: Date, endDate: Date): Promise<TrackingHistory | null> {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/tracking-history?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        return result.history;
      }
      return null;
    } catch (error) {
      console.error('Error fetching tracking history:', error);
      return null;
    }
  }
  
  // Emergency engine cutoff
  async emergencyStop(vehicleId: string, trackerId: string): Promise<boolean> {
    console.log(`🚨 EMERGENCY STOP requested for vehicle ${vehicleId}`);
    
    return await this.sendCommand({
      deviceId: trackerId,
      command: 'engine_cutoff',
      parameters: { reason: 'emergency_stop', timestamp: Date.now() }
    });
  }
  
  // Restore engine after cutoff
  async restoreEngine(vehicleId: string, trackerId: string): Promise<boolean> {
    console.log(`🔄 Engine restore requested for vehicle ${vehicleId}`);
    
    return await this.sendCommand({
      deviceId: trackerId,
      command: 'engine_restore',
      parameters: { timestamp: Date.now() }
    });
  }
  
  // Set geo-fence boundary
  async setGeoFence(trackerId: string, boundary: { center: [number, number], radius: number }): Promise<boolean> {
    console.log(`🛡️ Setting geo-fence for tracker ${trackerId}`);
    
    return await this.sendCommand({
      deviceId: trackerId,
      command: 'set_geofence',
      parameters: {
        latitude: boundary.center[1],
        longitude: boundary.center[0],
        radius: boundary.radius
      }
    });
  }
  
  // Get current vehicle location
  async getCurrentLocation(trackerId: string): Promise<{ latitude: number, longitude: number } | null> {
    try {
      const success = await this.sendCommand({
        deviceId: trackerId,
        command: 'get_location'
      });
      
      if (success) {
        // Location data will come through WebSocket
        return new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(null), 10000);
          
          const handleLocationUpdate = (event: any) => {
            if (event.detail.deviceId === trackerId) {
              clearTimeout(timeout);
              window.removeEventListener('gpsDataReceived', handleLocationUpdate);
              resolve({
                latitude: event.detail.latitude,
                longitude: event.detail.longitude
              });
            }
          };
          
          window.addEventListener('gpsDataReceived', handleLocationUpdate);
        });
      }
      return null;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }
  
  // Disconnect tracking
  disconnect() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
      console.log('🔌 GPS tracking disconnected');
    }
  }
}

export const gpsTrackingService = new GPSTrackingService();

/**
 * BW32 GPS Tracker Hardware Integration Guide
 * 
 * STEP 1: Hardware Setup
 * ----------------------
 * 1. Install BW32 GPS tracker in vehicle (connect to vehicle power)
 * 2. Insert SIM card with data plan
 * 3. Configure device to send data to your server: [YOUR_SERVER_IP]:8841
 * 4. Test device by sending SMS command: "SERVER#[YOUR_SERVER_IP]#8841#"
 * 
 * STEP 2: Server Configuration
 * ----------------------------
 * 1. Ensure backend server is running on port 5000
 * 2. BW32 integration service listening on port 8841
 * 3. WebSocket server running for real-time data
 * 4. Database configured for tracking history storage
 * 
 * STEP 3: Data Flow
 * -----------------
 * BW32 Tracker → 2G/4G Network → Server:8841 → WebSocket → Frontend
 * 
 * STEP 4: Real-Time Features
 * --------------------------
 * - Location updates every 30 seconds
 * - Emergency SOS alerts (immediate)
 * - Geo-fence violation alerts
 * - Engine status monitoring
 * - Speed limit enforcement
 * - Remote engine cutoff capability
 * 
 * STEP 5: Government Compliance
 * -----------------------------
 * - Encrypted data transmission
 * - Audit logging of all commands
 * - Emergency override protocols
 * - Data retention for investigations
 * - Multi-level access controls
 */
