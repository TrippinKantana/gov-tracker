/**
 * Bluetooth Device Integration
 * Handles short-range asset tracking via Bluetooth beacons and BLE devices
 * Ideal for indoor tracking, proximity detection, and warehouse inventory
 */

import { EventEmitter } from 'events';
// Noble package requires native compilation - temporarily disabled for easy setup
// import noble from '@abandonware/noble';

// Bluetooth Device Types for Government Assets
export enum BluetoothDeviceType {
  BEACON = 'beacon',
  ASSET_TAG = 'asset_tag',
  ACCESS_CARD = 'access_card',
  PANIC_BUTTON = 'panic_button',
  TEMPERATURE_SENSOR = 'temperature_sensor',
  PROXIMITY_SENSOR = 'proximity_sensor',
  INVENTORY_TAG = 'inventory_tag',
  PERSONNEL_BADGE = 'personnel_badge',
  VEHICLE_OBD = 'vehicle_obd',
  SMART_LOCK = 'smart_lock'
}

// Bluetooth Beacon Protocols
export enum BeaconProtocol {
  IBEACON = 'iBeacon',
  EDDYSTONE = 'Eddystone',
  ALTBEACON = 'AltBeacon',
  RUUVI = 'RuuviTag',
  CUSTOM = 'Custom'
}

export interface BluetoothDeviceInfo {
  deviceId: string; // MAC address or UUID
  name: string;
  deviceType: BluetoothDeviceType;
  protocol: BeaconProtocol;
  isActive: boolean;
  lastSeen: Date;
  rssi: number; // Signal strength
  txPower?: number; // Transmitted power for distance calculation
  batteryLevel?: number; // percentage
  firmwareVersion?: string;
  manufacturer?: string;
  proximity: 'immediate' | 'near' | 'far' | 'unknown';
  estimatedDistance?: number; // meters
  location?: {
    facility: string;
    room: string;
    coordinates?: { x: number; y: number; z?: number; };
  };
  metadata: Record<string, any>;
}

export interface BluetoothSensorReading {
  deviceId: string;
  timestamp: Date;
  deviceType: BluetoothDeviceType;
  readings: {
    temperature?: number; // Celsius
    humidity?: number; // percentage
    pressure?: number; // hPa
    batteryLevel?: number; // percentage
    buttonPressed?: boolean;
    proximity?: string; // Device is near this person/asset
    accessGranted?: boolean;
    lockStatus?: 'locked' | 'unlocked' | 'unknown';
    motionDetected?: boolean;
    tamperAlert?: boolean;
  };
  alertLevel: 'normal' | 'warning' | 'critical' | 'emergency';
  alertMessage?: string;
  rssi: number;
  estimatedDistance?: number;
}

export interface BeaconRegion {
  id: string;
  name: string;
  facility: string;
  uuid: string; // iBeacon UUID or similar identifier
  major?: number; // iBeacon major
  minor?: number; // iBeacon minor
  boundaries: {
    x1: number; y1: number;
    x2: number; y2: number;
    z?: number; // Floor level
  };
  scanPeriod: number; // seconds
  isActive: boolean;
}

export class BluetoothHandler extends EventEmitter {
  private devices: Map<string, BluetoothDeviceInfo> = new Map();
  private regions: Map<string, BeaconRegion> = new Map();
  private scanActive: boolean = false;
  private scanInterval?: NodeJS.Timeout;
  private rssiThreshold: number = -80; // dBm - minimum signal strength
  private proximityTimeout: number = 30000; // ms - time to consider device "lost"

  constructor() {
    super();
    this.setupNoble();
  }

  private setupNoble(): void {
    // Bluetooth functionality temporarily disabled for easy setup
    // Noble package requires native compilation which can be complex on Windows
    console.log('Bluetooth integration temporarily disabled - install noble package for full functionality');
    setTimeout(() => this.emit('ready'), 100);
  }

  private handleDeviceDiscovery(peripheral: any): void {
    const deviceId = peripheral.address || peripheral.id;
    const rssi = peripheral.rssi;
    
    // Filter out weak signals
    if (rssi < this.rssiThreshold) {
      return;
    }

    // Parse device info
    const deviceInfo = this.parsePeripheral(peripheral);
    if (!deviceInfo) {
      return;
    }

    // Update or add device
    const existingDevice = this.devices.get(deviceId);
    if (existingDevice) {
      existingDevice.lastSeen = new Date();
      existingDevice.rssi = rssi;
      existingDevice.proximity = this.calculateProximity(rssi, deviceInfo.txPower);
      existingDevice.estimatedDistance = this.estimateDistance(rssi, deviceInfo.txPower);
    } else {
      this.devices.set(deviceId, deviceInfo);
      console.log(`New Bluetooth device discovered: ${deviceId} (${deviceInfo.name})`);
      this.emit('deviceDiscovered', deviceInfo);
    }

    // Parse sensor data if available
    const sensorReading = this.parseSensorData(deviceInfo, peripheral);
    if (sensorReading) {
      this.emit('sensorReading', sensorReading);

      // Check for alerts
      if (sensorReading.alertLevel !== 'normal') {
        this.emit('alert', {
          deviceId,
          deviceType: deviceInfo.deviceType,
          alertLevel: sensorReading.alertLevel,
          message: sensorReading.alertMessage,
          timestamp: sensorReading.timestamp,
          readings: sensorReading.readings
        });
      }
    }

    this.emit('deviceUpdate', deviceInfo);
  }

  private parsePeripheral(peripheral: any): BluetoothDeviceInfo | null {
    const deviceId = peripheral.address || peripheral.id;
    const name = peripheral.advertisement?.localName || `Unknown Device ${deviceId}`;
    const rssi = peripheral.rssi;
    const manufacturerData = peripheral.advertisement?.manufacturerData;
    const serviceData = peripheral.advertisement?.serviceData;
    
    // Determine device type and protocol
    const { deviceType, protocol } = this.identifyDeviceType(peripheral);
    
    // Extract additional info
    const { txPower, batteryLevel } = this.extractDeviceInfo(peripheral);

    const deviceInfo: BluetoothDeviceInfo = {
      deviceId,
      name,
      deviceType,
      protocol,
      isActive: true,
      lastSeen: new Date(),
      rssi,
      txPower,
      batteryLevel,
      proximity: this.calculateProximity(rssi, txPower),
      estimatedDistance: this.estimateDistance(rssi, txPower),
      metadata: {
        manufacturerData: manufacturerData?.toString('hex'),
        serviceData: serviceData ? Object.fromEntries(serviceData) : undefined,
        services: peripheral.advertisement?.serviceUuids || []
      }
    };

    return deviceInfo;
  }

  private identifyDeviceType(peripheral: any): { deviceType: BluetoothDeviceType; protocol: BeaconProtocol } {
    const manufacturerData = peripheral.advertisement?.manufacturerData;
    const serviceUuids = peripheral.advertisement?.serviceUuids || [];
    const name = peripheral.advertisement?.localName?.toLowerCase() || '';

    // Check for iBeacon (Apple)
    if (manufacturerData && manufacturerData.length >= 25 && manufacturerData.readUInt16LE(0) === 0x004C) {
      const beaconType = manufacturerData.readUInt16LE(2);
      if (beaconType === 0x1502) {
        return {
          deviceType: this.inferDeviceTypeFromName(name),
          protocol: BeaconProtocol.IBEACON
        };
      }
    }

    // Check for Eddystone (Google)
    if (serviceUuids.includes('feaa')) {
      return {
        deviceType: this.inferDeviceTypeFromName(name),
        protocol: BeaconProtocol.EDDYSTONE
      };
    }

    // Check for RuuviTag
    if (serviceUuids.includes('6e400001-b5a3-f393-e0a9-e50e24dcca9e') || name.includes('ruuvi')) {
      return {
        deviceType: BluetoothDeviceType.TEMPERATURE_SENSOR,
        protocol: BeaconProtocol.RUUVI
      };
    }

    // Check for specific device patterns
    if (name.includes('panic') || name.includes('emergency')) {
      return { deviceType: BluetoothDeviceType.PANIC_BUTTON, protocol: BeaconProtocol.CUSTOM };
    }

    if (name.includes('lock') || serviceUuids.includes('6e400001-b5a3-f393-e0a9-e50e24dcca9e')) {
      return { deviceType: BluetoothDeviceType.SMART_LOCK, protocol: BeaconProtocol.CUSTOM };
    }

    // Default to beacon
    return {
      deviceType: BluetoothDeviceType.BEACON,
      protocol: BeaconProtocol.CUSTOM
    };
  }

  private inferDeviceTypeFromName(name: string): BluetoothDeviceType {
    if (name.includes('tag') || name.includes('asset')) return BluetoothDeviceType.ASSET_TAG;
    if (name.includes('card') || name.includes('badge')) return BluetoothDeviceType.PERSONNEL_BADGE;
    if (name.includes('panic') || name.includes('sos')) return BluetoothDeviceType.PANIC_BUTTON;
    if (name.includes('temp') || name.includes('sensor')) return BluetoothDeviceType.TEMPERATURE_SENSOR;
    if (name.includes('lock')) return BluetoothDeviceType.SMART_LOCK;
    if (name.includes('obd')) return BluetoothDeviceType.VEHICLE_OBD;
    
    return BluetoothDeviceType.BEACON;
  }

  private extractDeviceInfo(peripheral: any): { txPower?: number; batteryLevel?: number } {
    const manufacturerData = peripheral.advertisement?.manufacturerData;
    const serviceData = peripheral.advertisement?.serviceData;
    
    let txPower: number | undefined;
    let batteryLevel: number | undefined;

    // Extract TX Power from advertisement
    if (peripheral.advertisement?.txPowerLevel !== undefined) {
      txPower = peripheral.advertisement.txPowerLevel;
    }

    // Try to extract from manufacturer data (varies by manufacturer)
    if (manufacturerData && manufacturerData.length > 0) {
      // This is device-specific parsing - customize based on your devices
      // Example for common beacon formats
      if (manufacturerData.length >= 25) { // iBeacon format
        txPower = manufacturerData.readInt8(24); // TX power at 1 meter
      }
    }

    // Extract battery level from service data if available
    if (serviceData) {
      // Look for battery service data
      const batteryServiceData = serviceData.find((data: any) => data.uuid === '180f');
      if (batteryServiceData && batteryServiceData.data.length > 0) {
        batteryLevel = batteryServiceData.data.readUInt8(0);
      }
    }

    return { txPower, batteryLevel };
  }

  private calculateProximity(rssi: number, txPower?: number): 'immediate' | 'near' | 'far' | 'unknown' {
    if (!txPower) {
      // Use RSSI thresholds without TX power reference
      if (rssi >= -40) return 'immediate';
      if (rssi >= -60) return 'near';
      if (rssi >= -80) return 'far';
      return 'unknown';
    }

    const distance = this.estimateDistance(rssi, txPower);
    if (distance <= 1) return 'immediate';
    if (distance <= 3) return 'near';
    if (distance <= 10) return 'far';
    return 'unknown';
  }

  private estimateDistance(rssi: number, txPower?: number): number {
    if (!txPower) {
      txPower = -59; // Default TX power at 1 meter for most beacons
    }

    if (rssi === 0) {
      return -1.0;
    }

    const ratio = (txPower - rssi) / 20.0;
    if (ratio < 1.0) {
      return Math.pow(ratio, 10);
    } else {
      const accuracy = (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
      return accuracy;
    }
  }

  private parseSensorData(device: BluetoothDeviceInfo, peripheral: any): BluetoothSensorReading | null {
    const manufacturerData = peripheral.advertisement?.manufacturerData;
    const serviceData = peripheral.advertisement?.serviceData;

    try {
      switch (device.deviceType) {
        case BluetoothDeviceType.TEMPERATURE_SENSOR:
          return this.parseTemperatureSensor(device, manufacturerData, serviceData);
        
        case BluetoothDeviceType.PANIC_BUTTON:
          return this.parsePanicButton(device, manufacturerData, serviceData);
        
        case BluetoothDeviceType.SMART_LOCK:
          return this.parseSmartLock(device, manufacturerData, serviceData);
        
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error parsing sensor data for ${device.deviceId}:`, error);
      return null;
    }
  }

  private parseTemperatureSensor(device: BluetoothDeviceInfo, manufacturerData?: Buffer, serviceData?: any[]): BluetoothSensorReading | null {
    if (!manufacturerData || manufacturerData.length < 8) {
      return null;
    }

    // Example parsing for RuuviTag or similar
    const temperature = manufacturerData.readInt16BE(2) * 0.005;
    const humidity = (manufacturerData.readUInt16BE(4) & 0xFFC0) >> 6;
    const pressure = (manufacturerData.readUInt16BE(6) + 50000) / 100;
    const batteryLevel = manufacturerData.length > 8 ? manufacturerData.readUInt8(8) : undefined;

    return {
      deviceId: device.deviceId,
      timestamp: new Date(),
      deviceType: device.deviceType,
      readings: {
        temperature,
        humidity,
        pressure,
        batteryLevel
      },
      alertLevel: temperature < 0 || temperature > 40 ? 'warning' : 'normal',
      alertMessage: temperature < 0 || temperature > 40 ? 'Temperature out of range' : undefined,
      rssi: device.rssi,
      estimatedDistance: device.estimatedDistance
    };
  }

  private parsePanicButton(device: BluetoothDeviceInfo, manufacturerData?: Buffer, serviceData?: any[]): BluetoothSensorReading | null {
    if (!manufacturerData || manufacturerData.length < 2) {
      return null;
    }

    const buttonPressed = manufacturerData.readUInt8(0) === 1;
    const batteryLevel = manufacturerData.length > 1 ? manufacturerData.readUInt8(1) : undefined;

    return {
      deviceId: device.deviceId,
      timestamp: new Date(),
      deviceType: device.deviceType,
      readings: {
        buttonPressed,
        batteryLevel
      },
      alertLevel: buttonPressed ? 'emergency' : 'normal',
      alertMessage: buttonPressed ? 'EMERGENCY: Panic button activated!' : undefined,
      rssi: device.rssi,
      estimatedDistance: device.estimatedDistance
    };
  }

  private parseSmartLock(device: BluetoothDeviceInfo, manufacturerData?: Buffer, serviceData?: any[]): BluetoothSensorReading | null {
    if (!manufacturerData || manufacturerData.length < 3) {
      return null;
    }

    const lockStatus = manufacturerData.readUInt8(0) === 1 ? 'locked' : 'unlocked';
    const accessGranted = manufacturerData.readUInt8(1) === 1;
    const batteryLevel = manufacturerData.readUInt8(2);

    return {
      deviceId: device.deviceId,
      timestamp: new Date(),
      deviceType: device.deviceType,
      readings: {
        lockStatus,
        accessGranted,
        batteryLevel
      },
      alertLevel: accessGranted && lockStatus === 'unlocked' ? 'warning' : 'normal',
      alertMessage: accessGranted && lockStatus === 'unlocked' ? 'Access granted - door unlocked' : undefined,
      rssi: device.rssi,
      estimatedDistance: device.estimatedDistance
    };
  }

  // Public methods
  public async startScanning(serviceUuids?: string[], allowDuplicates: boolean = true): Promise<void> {
    console.log('Bluetooth scanning temporarily disabled - mock mode active');
    // Simulate scanning with mock devices for testing
    this.simulateMockDevices();
  }

  public async stopScanning(): Promise<void> {
    console.log('Stopping Bluetooth scanning simulation');
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = undefined;
    }
  }

  private simulateMockDevices(): void {
    // Simulate finding some Bluetooth devices for testing
    const mockDevices = [
      {
        deviceId: 'BLE001',
        name: 'Gov Asset Tag #001',
        deviceType: BluetoothDeviceType.ASSET_TAG,
        protocol: BeaconProtocol.IBEACON,
        rssi: -55,
        batteryLevel: 85
      },
      {
        deviceId: 'BLE002', 
        name: 'Panic Button - Security',
        deviceType: BluetoothDeviceType.PANIC_BUTTON,
        protocol: BeaconProtocol.CUSTOM,
        rssi: -62,
        batteryLevel: 92
      }
    ];

    mockDevices.forEach((mock, index) => {
      setTimeout(() => {
        const device: BluetoothDeviceInfo = {
          deviceId: mock.deviceId,
          name: mock.name,
          deviceType: mock.deviceType,
          protocol: mock.protocol,
          isActive: true,
          lastSeen: new Date(),
          rssi: mock.rssi,
          batteryLevel: mock.batteryLevel,
          proximity: 'near',
          estimatedDistance: 2.5,
          metadata: { mock: true }
        };
        
        this.devices.set(mock.deviceId, device);
        this.emit('deviceDiscovered', device);
      }, index * 1000);
    });
  }

  private cleanupOldDevices(): void {
    const now = new Date();
    const devicesToRemove: string[] = [];

    for (const [deviceId, device] of this.devices) {
      const timeSinceLastSeen = now.getTime() - device.lastSeen.getTime();
      
      if (timeSinceLastSeen > this.proximityTimeout) {
        devicesToRemove.push(deviceId);
        device.isActive = false;
        this.emit('deviceLost', device);
      }
    }

    devicesToRemove.forEach(deviceId => {
      this.devices.delete(deviceId);
    });

    if (devicesToRemove.length > 0) {
      console.log(`Removed ${devicesToRemove.length} inactive Bluetooth devices`);
    }
  }

  public registerBeaconRegion(region: BeaconRegion): void {
    this.regions.set(region.id, region);
    console.log(`Registered beacon region: ${region.name}`);
  }

  public unregisterBeaconRegion(regionId: string): void {
    this.regions.delete(regionId);
    console.log(`Unregistered beacon region: ${regionId}`);
  }

  public getDevicesInRegion(regionId: string): BluetoothDeviceInfo[] {
    const region = this.regions.get(regionId);
    if (!region) {
      return [];
    }

    return Array.from(this.devices.values()).filter(device => {
      // Simple proximity-based region detection
      // In real implementation, you'd use more sophisticated location logic
      return device.isActive && device.proximity !== 'unknown';
    });
  }

  public getNearbyDevices(maxDistance?: number): BluetoothDeviceInfo[] {
    return Array.from(this.devices.values()).filter(device => {
      return device.isActive && 
             (!maxDistance || !device.estimatedDistance || device.estimatedDistance <= maxDistance);
    });
  }

  public getConnectedDevices(): BluetoothDeviceInfo[] {
    return Array.from(this.devices.values()).filter(device => device.isActive);
  }

  public getDeviceInfo(deviceId: string): BluetoothDeviceInfo | undefined {
    return this.devices.get(deviceId);
  }

  public setRSSIThreshold(threshold: number): void {
    this.rssiThreshold = threshold;
    console.log(`RSSI threshold set to ${threshold} dBm`);
  }

  public setProximityTimeout(timeout: number): void {
    this.proximityTimeout = timeout;
    console.log(`Proximity timeout set to ${timeout} ms`);
  }

  public async shutdown(): Promise<void> {
    await this.stopScanning();
    this.devices.clear();
    this.regions.clear();
    console.log('Bluetooth Handler shut down');
  }
}
