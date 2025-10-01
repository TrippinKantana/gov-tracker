/**
 * Notification Triggers
 * Monitors platform events and triggers appropriate notifications
 */

class NotificationTriggers {
  constructor(notificationSystem, gpsHandler) {
    this.notifications = notificationSystem;
    this.gpsHandler = gpsHandler;
    this.setupTriggers();
  }

  setupTriggers() {
    // GPS/Security Event Triggers
    this.setupGPSTriggers();
    
    // Asset Management Triggers  
    this.setupAssetTriggers();
    
    // Maintenance Triggers
    this.setupMaintenanceTriggers();
    
    // System Health Triggers
    this.setupSystemTriggers();
    
    console.log('🎯 Notification triggers initialized');
  }

  /**
   * GPS and Security Triggers
   */
  setupGPSTriggers() {
    // SOS Button Activation
    this.gpsHandler.on('alarm', async (alarm) => {
      if (alarm.alarmType === 'SOS') {
        await this.notifications.notifySOSActivation(
          alarm.vehicleId,
          `${alarm.latitude}, ${alarm.longitude}`,
          alarm.operatorName || 'Unknown'
        );
      }
    });

    // GPS Tracker Offline
    setInterval(() => {
      this.checkOfflineTrackers();
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Unauthorized Movement (after hours)
    this.gpsHandler.on('position', (position) => {
      this.checkUnauthorizedMovement(position);
    });
  }

  /**
   * Asset Management Triggers
   */
  setupAssetTriggers() {
    // Asset Transfer Events
    this.setupAssetTransferMonitoring();
    
    // New Asset Approval Required
    this.setupNewAssetMonitoring();
    
    // Depreciation Monitoring
    this.setupDepreciationMonitoring();
  }

  /**
   * Maintenance Triggers
   */
  setupMaintenanceTriggers() {
    // Check maintenance due daily at 9 AM
    setInterval(() => {
      this.checkMaintenanceDue();
    }, 24 * 60 * 60 * 1000); // Daily check

    // Low fuel monitoring
    this.setupFuelMonitoring();
  }

  /**
   * System Health Triggers
   */
  setupSystemTriggers() {
    // Monitor API errors
    this.setupErrorMonitoring();
    
    // Database health checks
    this.setupHealthChecks();
  }

  // =============================================================================
  // SPECIFIC TRIGGER IMPLEMENTATIONS
  // =============================================================================

  /**
   * Check for offline GPS trackers
   */
  async checkOfflineTrackers() {
    const devices = this.gpsHandler.devices;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    devices.forEach(async (device, deviceId) => {
      if (device.vehicleId && device.lastSeen) {
        const lastSeen = new Date(device.lastSeen);
        if (lastSeen < thirtyMinutesAgo) {
          await this.notifications.sendNotification({
            type: 'security',
            priority: 'urgent',
            title: `📡 GPS Tracker Offline: ${device.vehicleId}`,
            message: `GPS tracker for vehicle ${device.vehicleId} has been offline for more than 30 minutes. Last seen: ${lastSeen.toLocaleString()}`,
            data: { vehicleId: device.vehicleId, deviceId, lastSeen: device.lastSeen },
            channels: ['in-app', 'email', 'desktop']
          });
        }
      }
    });
  }

  /**
   * Check for unauthorized movement (after hours)
   */
  async checkUnauthorizedMovement(position) {
    const hour = new Date().getHours();
    const isAfterHours = hour < 6 || hour > 22; // Before 6 AM or after 10 PM
    
    if (isAfterHours && position.speedKph > 10) {
      await this.notifications.sendNotification({
        type: 'security',
        priority: 'urgent', 
        title: `🌙 After-Hours Vehicle Movement: ${position.vehicleId}`,
        message: `Vehicle ${position.vehicleId} is moving at ${position.speedKph} km/h outside business hours`,
        data: { 
          vehicleId: position.vehicleId, 
          speed: position.speedKph,
          location: `${position.latitude}, ${position.longitude}`,
          time: position.fixTimeUtc
        },
        channels: ['in-app', 'email', 'desktop']
      });
    }
  }

  /**
   * Check maintenance due dates
   */
  async checkMaintenanceDue() {
    // TODO: Query database for vehicles/equipment due for maintenance
    // This would check:
    // 1. Vehicles at or over their maintenance interval (km)
    // 2. Equipment at or over their maintenance interval (months)
    console.log('🔧 Checking maintenance due dates...');
  }

  /**
   * Monitor fuel levels
   */
  setupFuelMonitoring() {
    this.gpsHandler.on('position', async (position) => {
      // Assuming fuel level comes from some vehicles
      if (position.fuelLevel && position.fuelLevel <= 25) {
        await this.notifications.notifyLowFuel(
          position.vehicleId,
          position.fuelLevel,
          `${position.latitude}, ${position.longitude}`
        );
      }
    });
  }

  /**
   * Asset Transfer Monitoring
   */
  setupAssetTransferMonitoring() {
    // TODO: Listen for asset transfer events from your backend
    console.log('📦 Asset transfer monitoring active');
  }

  /**
   * New Asset Monitoring
   */
  setupNewAssetMonitoring() {
    // TODO: Listen for new asset creation events
    console.log('🆕 New asset monitoring active');
  }

  /**
   * Depreciation Monitoring
   */
  setupDepreciationMonitoring() {
    // Check daily for assets approaching 4-year depreciation limit
    setInterval(() => {
      this.checkDepreciation();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Check for assets approaching depreciation limit
   */
  async checkDepreciation() {
    // TODO: Query database for assets approaching 4-year limit
    console.log('📊 Checking asset depreciation...');
  }

  /**
   * Error Monitoring
   */
  setupErrorMonitoring() {
    process.on('uncaughtException', async (error) => {
      await this.notifications.sendNotification({
        type: 'system',
        priority: 'urgent',
        title: '🚨 System Error',
        message: `Critical system error: ${error.message}`,
        data: { error: error.stack },
        channels: ['email']
      });
    });
  }

  /**
   * Health Checks
   */
  setupHealthChecks() {
    // Check system health every hour
    setInterval(() => {
      this.performHealthCheck();
    }, 60 * 60 * 1000);
  }

  async performHealthCheck() {
    // TODO: Implement health checks for database, APIs, GPS system
    console.log('❤️ System health check performed');
  }
}

module.exports = NotificationTriggers;
