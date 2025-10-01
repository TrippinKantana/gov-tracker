/**
 * Hardware Device Manager
 * Centralized management for all hardware integrations
 * Coordinates BW32 GPS trackers, LoRaWAN sensors, and Bluetooth devices
 */

import { EventEmitter } from 'events';
import { BW32Integration, BW32LocationData, BW32AlarmData } from './bw32-integration';
import { LoRaWANGateway, LoRaWANSensorReading, LoRaWANDeviceInfo } from './lorawan-gateway';
import { BluetoothHandler, BluetoothSensorReading, BluetoothDeviceInfo } from './bluetooth-handler';

export interface DeviceManagerConfig {
  bw32Port?: number;
  lorawanConfig?: {
    networkServerUrl: string;
    applicationId: string;
    accessKey: string;
    mqttBrokerUrl: string;
  };
  bluetoothEnabled?: boolean;
}

export interface UnifiedDeviceInfo {
  deviceId: string;
  name: string;
  type: 'bw32' | 'lorawan' | 'bluetooth';
  deviceCategory: string; // vehicle, facility, sensor, etc.
  isActive: boolean;
  lastSeen: Date;
  location?: {
    latitude?: number;
    longitude?: number;
    facility?: string;
    room?: string;
  };
  batteryLevel?: number;
  signalStrength: number;
  status: 'online' | 'offline' | 'maintenance' | 'alert';
  metadata: Record<string, any>;
}

export interface UnifiedSensorReading {
  deviceId: string;
  timestamp: Date;
  deviceType: 'bw32' | 'lorawan' | 'bluetooth';
  readings: Record<string, any>;
  alertLevel: 'normal' | 'warning' | 'critical' | 'emergency';
  alertMessage?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    facility?: string;
  };
}

export interface UnifiedAlert {
  alertId: string;
  deviceId: string;
  deviceType: 'bw32' | 'lorawan' | 'bluetooth';
  alertType: string;
  alertLevel: 'normal' | 'warning' | 'critical' | 'emergency';
  message: string;
  timestamp: Date;
  location?: {
    latitude?: number;
    longitude?: number;
    facility?: string;
  };
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export class DeviceManager extends EventEmitter {
  private bw32Integration?: BW32Integration;
  private lorawanGateway?: LoRaWANGateway;
  private bluetoothHandler?: BluetoothHandler;
  private devices: Map<string, UnifiedDeviceInfo> = new Map();
  private alerts: Map<string, UnifiedAlert> = new Map();
  private config: DeviceManagerConfig;

  constructor(config: DeviceManagerConfig) {
    super();
    this.config = config;
  }

  public async initialize(): Promise<void> {
    console.log('Initializing Hardware Device Manager...');

    try {
      // Initialize BW32 GPS Tracker Integration
      if (this.config.bw32Port) {
        this.bw32Integration = new BW32Integration(this.config.bw32Port);
        await this.setupBW32Events();
        await this.bw32Integration.start();
        console.log('BW32 GPS Tracker integration initialized');
      }

      // Initialize LoRaWAN Gateway
      if (this.config.lorawanConfig) {
        this.lorawanGateway = new LoRaWANGateway(this.config.lorawanConfig);
        await this.setupLoRaWANEvents();
        await this.lorawanGateway.initialize();
        console.log('LoRaWAN Gateway integration initialized');
      }

      // Initialize Bluetooth Handler
      if (this.config.bluetoothEnabled) {
        this.bluetoothHandler = new BluetoothHandler();
        await this.setupBluetoothEvents();
        
        // Wait for Bluetooth to be ready
        await new Promise<void>((resolve) => {
          this.bluetoothHandler!.on('ready', resolve);
          // Auto-resolve after timeout to prevent hanging
          setTimeout(resolve, 5000);
        });

        await this.bluetoothHandler.startScanning();
        console.log('Bluetooth Handler integration initialized');
      }

      console.log('Hardware Device Manager initialized successfully');
      this.emit('initialized');

    } catch (error) {
      console.error('Failed to initialize Hardware Device Manager:', error);
      throw error;
    }
  }

  private async setupBW32Events(): Promise<void> {
    if (!this.bw32Integration) return;

    this.bw32Integration.on('deviceLogin', (deviceInfo) => {
      const unifiedDevice = this.convertBW32ToUnified(deviceInfo);
      this.devices.set(deviceInfo.deviceId, unifiedDevice);
      this.emit('deviceConnected', unifiedDevice);
    });

    this.bw32Integration.on('deviceDisconnect', (deviceId) => {
      const device = this.devices.get(deviceId);
      if (device) {
        device.status = 'offline';
        device.isActive = false;
        this.emit('deviceDisconnected', device);
      }
    });

    this.bw32Integration.on('locationUpdate', (locationData: BW32LocationData) => {
      this.handleBW32LocationUpdate(locationData);
    });

    this.bw32Integration.on('alarm', (alarmData: BW32AlarmData) => {
      this.handleBW32Alarm(alarmData);
    });

    this.bw32Integration.on('sos', (sosData: BW32AlarmData) => {
      this.handleBW32SOS(sosData);
    });
  }

  private async setupLoRaWANEvents(): Promise<void> {
    if (!this.lorawanGateway) return;

    this.lorawanGateway.on('initialized', () => {
      // Load existing LoRaWAN devices
      const lorawanDevices = this.lorawanGateway!.getConnectedDevices();
      for (const device of lorawanDevices) {
        const unifiedDevice = this.convertLoRaWANToUnified(device);
        this.devices.set(device.deviceEUI, unifiedDevice);
      }
    });

    this.lorawanGateway.on('sensorReading', (reading: LoRaWANSensorReading) => {
      this.handleLoRaWANSensorReading(reading);
    });

    this.lorawanGateway.on('alert', (alertData) => {
      this.handleLoRaWANAlert(alertData);
    });

    this.lorawanGateway.on('deviceJoin', (joinData) => {
      console.log(`LoRaWAN device joined: ${joinData.deviceEUI}`);
      // Device info will be updated on next sensor reading
    });
  }

  private async setupBluetoothEvents(): Promise<void> {
    if (!this.bluetoothHandler) return;

    this.bluetoothHandler.on('deviceDiscovered', (deviceInfo: BluetoothDeviceInfo) => {
      const unifiedDevice = this.convertBluetoothToUnified(deviceInfo);
      this.devices.set(deviceInfo.deviceId, unifiedDevice);
      this.emit('deviceDiscovered', unifiedDevice);
    });

    this.bluetoothHandler.on('deviceUpdate', (deviceInfo: BluetoothDeviceInfo) => {
      const unifiedDevice = this.convertBluetoothToUnified(deviceInfo);
      this.devices.set(deviceInfo.deviceId, unifiedDevice);
      this.emit('deviceUpdate', unifiedDevice);
    });

    this.bluetoothHandler.on('deviceLost', (deviceInfo: BluetoothDeviceInfo) => {
      const device = this.devices.get(deviceInfo.deviceId);
      if (device) {
        device.status = 'offline';
        device.isActive = false;
        this.emit('deviceLost', device);
      }
    });

    this.bluetoothHandler.on('sensorReading', (reading: BluetoothSensorReading) => {
      this.handleBluetoothSensorReading(reading);
    });

    this.bluetoothHandler.on('alert', (alertData) => {
      this.handleBluetoothAlert(alertData);
    });
  }

  private handleBW32LocationUpdate(locationData: BW32LocationData): void {
    // Update device location
    const device = this.devices.get(locationData.deviceId);
    if (device) {
      device.location = {
        latitude: locationData.latitude,
        longitude: locationData.longitude
      };
      device.lastSeen = locationData.timestamp;
      device.batteryLevel = locationData.battery;
      device.status = 'online';
      device.isActive = true;
    }

    // Create unified sensor reading
    const unifiedReading: UnifiedSensorReading = {
      deviceId: locationData.deviceId,
      timestamp: locationData.timestamp,
      deviceType: 'bw32',
      readings: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        speed: locationData.speed,
        course: locationData.course,
        altitude: locationData.altitude,
        batteryLevel: locationData.battery,
        ignition: locationData.acc,
        gpsFixed: locationData.gpsFixed
      },
      alertLevel: locationData.battery && locationData.battery < 20 ? 'warning' : 'normal',
      alertMessage: locationData.battery && locationData.battery < 20 ? 'Low battery level' : undefined,
      location: {
        latitude: locationData.latitude,
        longitude: locationData.longitude
      }
    };

    this.emit('sensorReading', unifiedReading);
  }

  private handleBW32Alarm(alarmData: BW32AlarmData): void {
    const alert = this.createUnifiedAlert(alarmData.deviceId, 'bw32', 'alarm', alarmData.alarmMessage, 'critical', {
      latitude: alarmData.latitude,
      longitude: alarmData.longitude
    });

    this.alerts.set(alert.alertId, alert);
    this.emit('alert', alert);
  }

  private handleBW32SOS(sosData: BW32AlarmData): void {
    const alert = this.createUnifiedAlert(sosData.deviceId, 'bw32', 'sos', 'SOS Emergency Alert', 'emergency', {
      latitude: sosData.latitude,
      longitude: sosData.longitude
    });

    this.alerts.set(alert.alertId, alert);
    this.emit('emergencyAlert', alert);
  }

  private handleLoRaWANSensorReading(reading: LoRaWANSensorReading): void {
    // Update device info
    const device = this.devices.get(reading.deviceEUI);
    if (device) {
      device.lastSeen = reading.timestamp;
      device.batteryLevel = reading.readings.batteryLevel;
      device.status = reading.alertLevel === 'critical' || reading.alertLevel === 'emergency' ? 'alert' : 'online';
      
      if (reading.readings.gpsLatitude && reading.readings.gpsLongitude) {
        device.location = {
          latitude: reading.readings.gpsLatitude,
          longitude: reading.readings.gpsLongitude
        };
      }
    }

    // Create unified sensor reading
    const unifiedReading: UnifiedSensorReading = {
      deviceId: reading.deviceEUI,
      timestamp: reading.timestamp,
      deviceType: 'lorawan',
      readings: reading.readings,
      alertLevel: reading.alertLevel,
      alertMessage: reading.alertMessage,
      location: reading.readings.gpsLatitude && reading.readings.gpsLongitude ? {
        latitude: reading.readings.gpsLatitude,
        longitude: reading.readings.gpsLongitude
      } : undefined
    };

    this.emit('sensorReading', unifiedReading);
  }

  private handleLoRaWANAlert(alertData: any): void {
    const alert = this.createUnifiedAlert(
      alertData.deviceEUI,
      'lorawan',
      alertData.sensorType,
      alertData.message,
      alertData.alertLevel
    );

    this.alerts.set(alert.alertId, alert);
    this.emit('alert', alert);
  }

  private handleBluetoothSensorReading(reading: BluetoothSensorReading): void {
    // Update device info
    const device = this.devices.get(reading.deviceId);
    if (device) {
      device.lastSeen = reading.timestamp;
      device.batteryLevel = reading.readings.batteryLevel;
      device.signalStrength = reading.rssi;
      device.status = reading.alertLevel === 'critical' || reading.alertLevel === 'emergency' ? 'alert' : 'online';
    }

    // Create unified sensor reading
    const unifiedReading: UnifiedSensorReading = {
      deviceId: reading.deviceId,
      timestamp: reading.timestamp,
      deviceType: 'bluetooth',
      readings: reading.readings,
      alertLevel: reading.alertLevel,
      alertMessage: reading.alertMessage
    };

    this.emit('sensorReading', unifiedReading);
  }

  private handleBluetoothAlert(alertData: any): void {
    const alert = this.createUnifiedAlert(
      alertData.deviceId,
      'bluetooth',
      alertData.deviceType,
      alertData.message,
      alertData.alertLevel
    );

    this.alerts.set(alert.alertId, alert);
    
    if (alert.alertLevel === 'emergency') {
      this.emit('emergencyAlert', alert);
    } else {
      this.emit('alert', alert);
    }
  }

  private createUnifiedAlert(
    deviceId: string,
    deviceType: 'bw32' | 'lorawan' | 'bluetooth',
    alertType: string,
    message: string,
    alertLevel: 'normal' | 'warning' | 'critical' | 'emergency',
    location?: { latitude?: number; longitude?: number; facility?: string }
  ): UnifiedAlert {
    return {
      alertId: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId,
      deviceType,
      alertType,
      alertLevel,
      message,
      timestamp: new Date(),
      location,
      acknowledged: false
    };
  }

  private convertBW32ToUnified(deviceInfo: any): UnifiedDeviceInfo {
    return {
      deviceId: deviceInfo.deviceId,
      name: deviceInfo.deviceId, // Could be enhanced with asset mapping
      type: 'bw32',
      deviceCategory: 'vehicle', // Default for BW32 trackers
      isActive: deviceInfo.isOnline,
      lastSeen: deviceInfo.lastSeen,
      batteryLevel: undefined, // Will be updated with location data
      signalStrength: 0, // GSM signal strength
      status: deviceInfo.isOnline ? 'online' : 'offline',
      metadata: deviceInfo
    };
  }

  private convertLoRaWANToUnified(deviceInfo: LoRaWANDeviceInfo): UnifiedDeviceInfo {
    return {
      deviceId: deviceInfo.deviceEUI,
      name: deviceInfo.deviceName,
      type: 'lorawan',
      deviceCategory: deviceInfo.sensorType,
      isActive: deviceInfo.isActive,
      lastSeen: deviceInfo.lastSeen,
      location: deviceInfo.location ? {
        latitude: deviceInfo.location.latitude,
        longitude: deviceInfo.location.longitude
      } : undefined,
      batteryLevel: deviceInfo.batteryLevel,
      signalStrength: deviceInfo.signalStrength,
      status: deviceInfo.isActive ? 'online' : 'offline',
      metadata: deviceInfo
    };
  }

  private convertBluetoothToUnified(deviceInfo: BluetoothDeviceInfo): UnifiedDeviceInfo {
    return {
      deviceId: deviceInfo.deviceId,
      name: deviceInfo.name,
      type: 'bluetooth',
      deviceCategory: deviceInfo.deviceType,
      isActive: deviceInfo.isActive,
      lastSeen: deviceInfo.lastSeen,
      location: deviceInfo.location ? {
        facility: deviceInfo.location.facility,
        room: deviceInfo.location.room
      } : undefined,
      batteryLevel: deviceInfo.batteryLevel,
      signalStrength: deviceInfo.rssi,
      status: deviceInfo.isActive ? 'online' : 'offline',
      metadata: deviceInfo
    };
  }

  // Public API methods
  public getAllDevices(): UnifiedDeviceInfo[] {
    return Array.from(this.devices.values());
  }

  public getDevicesByType(type: 'bw32' | 'lorawan' | 'bluetooth'): UnifiedDeviceInfo[] {
    return Array.from(this.devices.values()).filter(device => device.type === type);
  }

  public getActiveDevices(): UnifiedDeviceInfo[] {
    return Array.from(this.devices.values()).filter(device => device.isActive);
  }

  public getDevice(deviceId: string): UnifiedDeviceInfo | undefined {
    return this.devices.get(deviceId);
  }

  public getAlerts(acknowledgedFilter?: boolean): UnifiedAlert[] {
    const alerts = Array.from(this.alerts.values());
    if (acknowledgedFilter !== undefined) {
      return alerts.filter(alert => alert.acknowledged === acknowledgedFilter);
    }
    return alerts;
  }

  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();
      this.emit('alertAcknowledged', alert);
      return true;
    }
    return false;
  }

  // Hardware control methods
  public async cutOffEngine(deviceId: string): Promise<boolean> {
    if (this.bw32Integration) {
      return await this.bw32Integration.cutOffEngine(deviceId);
    }
    return false;
  }

  public async restoreEngine(deviceId: string): Promise<boolean> {
    if (this.bw32Integration) {
      return await this.bw32Integration.restoreEngine(deviceId);
    }
    return false;
  }

  public async sendLoRaWANDownlink(deviceEUI: string, port: number, data: Buffer, confirmed: boolean = false): Promise<boolean> {
    if (this.lorawanGateway) {
      return await this.lorawanGateway.sendDownlinkMessage(deviceEUI, port, data, confirmed);
    }
    return false;
  }

  public getSystemStatus(): { [key: string]: string } {
    return {
      bw32Integration: this.bw32Integration ? 'online' : 'disabled',
      lorawanGateway: this.lorawanGateway ? 'online' : 'disabled',
      bluetoothHandler: this.bluetoothHandler ? 'online' : 'disabled',
      totalDevices: this.devices.size.toString(),
      activeDevices: this.getActiveDevices().length.toString(),
      unacknowledgedAlerts: this.getAlerts(false).length.toString()
    };
  }

  public async shutdown(): Promise<void> {
    console.log('Shutting down Hardware Device Manager...');

    if (this.bw32Integration) {
      await this.bw32Integration.stop();
    }

    if (this.lorawanGateway) {
      await this.lorawanGateway.shutdown();
    }

    if (this.bluetoothHandler) {
      await this.bluetoothHandler.shutdown();
    }

    this.devices.clear();
    this.alerts.clear();

    console.log('Hardware Device Manager shut down complete');
  }
}
