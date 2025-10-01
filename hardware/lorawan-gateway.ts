/**
 * LoRaWAN Gateway Integration
 * Handles long-range, low-power asset monitoring via LoRaWAN network
 * Ideal for remote facilities, equipment in areas without cellular coverage
 */

import { EventEmitter } from 'events';
import axios from 'axios';
import mqtt, { MqttClient } from 'mqtt';

// LoRaWAN Message Types
export enum LoRaWANMessageType {
  UPLINK = 'uplink',
  DOWNLINK = 'downlink',
  JOIN = 'join',
  HEARTBEAT = 'heartbeat',
  SENSOR_DATA = 'sensor_data',
  ALARM = 'alarm',
  STATUS = 'status'
}

// LoRaWAN Device Classes
export enum LoRaWANDeviceClass {
  CLASS_A = 'A', // Most power efficient, bi-directional with scheduled receive slots
  CLASS_B = 'B', // Scheduled receive slots with beacon
  CLASS_C = 'C', // Continuous listening, highest power consumption
}

// LoRaWAN Sensor Types for Government Assets
export enum LoRaWANSensorType {
  GPS_TRACKER = 'gps_tracker',
  DOOR_SENSOR = 'door_sensor',
  MOTION_DETECTOR = 'motion_detector',
  TEMPERATURE_HUMIDITY = 'temp_humidity',
  ASSET_TAG = 'asset_tag',
  PANIC_BUTTON = 'panic_button',
  FUEL_LEVEL = 'fuel_level',
  GENERATOR_MONITOR = 'generator_monitor',
  SECURITY_CAMERA = 'security_camera',
  ACCESS_CONTROL = 'access_control'
}

export interface LoRaWANDeviceInfo {
  deviceEUI: string;
  applicationEUI: string;
  deviceName: string;
  deviceClass: LoRaWANDeviceClass;
  sensorType: LoRaWANSensorType;
  isActive: boolean;
  lastSeen: Date;
  batteryLevel?: number; // percentage
  signalStrength: number; // RSSI
  spreadingFactor: number;
  frequency: number; // MHz
  gatewayId: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  metadata: Record<string, any>;
}

export interface LoRaWANUplinkMessage {
  deviceEUI: string;
  timestamp: Date;
  messageType: LoRaWANMessageType;
  payload: Buffer;
  decodedPayload?: Record<string, any>;
  port: number;
  rssi: number;
  snr: number;
  spreadingFactor: number;
  frequency: number;
  gatewayInfo: {
    gatewayId: string;
    gatewayEUI: string;
    location?: { latitude: number; longitude: number; };
    rssi: number;
    snr: number;
  }[];
}

export interface LoRaWANSensorReading {
  deviceEUI: string;
  timestamp: Date;
  sensorType: LoRaWANSensorType;
  readings: {
    temperature?: number; // Celsius
    humidity?: number; // percentage
    batteryVoltage?: number; // volts
    batteryLevel?: number; // percentage
    gpsLatitude?: number;
    gpsLongitude?: number;
    gpsAccuracy?: number; // meters
    doorOpen?: boolean;
    motionDetected?: boolean;
    fuelLevel?: number; // liters or percentage
    generatorRunning?: boolean;
    generatorFuelLevel?: number;
    accessGranted?: boolean;
    accessDenied?: boolean;
    panicButtonPressed?: boolean;
    tamperDetected?: boolean;
  };
  alertLevel: 'normal' | 'warning' | 'critical' | 'emergency';
  alertMessage?: string;
}

export class LoRaWANGateway extends EventEmitter {
  private mqttClient: MqttClient | null = null;
  private devices: Map<string, LoRaWANDeviceInfo> = new Map();
  private networkServerUrl: string;
  private applicationId: string;
  private accessKey: string;
  private mqttBrokerUrl: string;

  constructor(config: {
    networkServerUrl: string;
    applicationId: string;
    accessKey: string;
    mqttBrokerUrl: string;
  }) {
    super();
    this.networkServerUrl = config.networkServerUrl;
    this.applicationId = config.applicationId;
    this.accessKey = config.accessKey;
    this.mqttBrokerUrl = config.mqttBrokerUrl;
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize MQTT connection for real-time data
      await this.setupMQTTConnection();
      
      // Fetch registered devices from network server
      await this.fetchDeviceList();
      
      console.log('LoRaWAN Gateway initialized successfully');
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize LoRaWAN Gateway:', error);
      throw error;
    }
  }

  private async setupMQTTConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.mqttClient = mqtt.connect(this.mqttBrokerUrl, {
        username: this.applicationId,
        password: this.accessKey,
        clientId: `gov-asset-tracker-${Date.now()}`,
        clean: true,
        reconnectPeriod: 5000,
      });

      this.mqttClient.on('connect', () => {
        console.log('Connected to LoRaWAN MQTT broker');
        
        // Subscribe to uplink messages
        const uplinkTopic = `application/${this.applicationId}/device/+/event/up`;
        this.mqttClient!.subscribe(uplinkTopic, (error) => {
          if (error) {
            console.error('Failed to subscribe to uplink topic:', error);
            reject(error);
          } else {
            console.log(`Subscribed to LoRaWAN uplink topic: ${uplinkTopic}`);
            resolve();
          }
        });

        // Subscribe to join events
        const joinTopic = `application/${this.applicationId}/device/+/event/join`;
        this.mqttClient!.subscribe(joinTopic);

        // Subscribe to status events
        const statusTopic = `application/${this.applicationId}/device/+/event/status`;
        this.mqttClient!.subscribe(statusTopic);
      });

      this.mqttClient.on('message', (topic, message) => {
        try {
          this.handleMQTTMessage(topic, message);
        } catch (error) {
          console.error('Error handling MQTT message:', error);
        }
      });

      this.mqttClient.on('error', (error) => {
        console.error('LoRaWAN MQTT error:', error);
        reject(error);
      });

      this.mqttClient.on('offline', () => {
        console.warn('LoRaWAN MQTT connection offline');
      });

      this.mqttClient.on('reconnect', () => {
        console.log('LoRaWAN MQTT reconnecting...');
      });
    });
  }

  private async fetchDeviceList(): Promise<void> {
    try {
      const response = await axios.get(`${this.networkServerUrl}/api/applications/${this.applicationId}/devices`, {
        headers: {
          'Authorization': `Bearer ${this.accessKey}`,
          'Content-Type': 'application/json'
        }
      });

      const devices = response.data.result || response.data.devices || [];
      
      for (const deviceData of devices) {
        const device: LoRaWANDeviceInfo = {
          deviceEUI: deviceData.devEUI,
          applicationEUI: deviceData.applicationEUI || this.applicationId,
          deviceName: deviceData.name,
          deviceClass: deviceData.deviceClass || LoRaWANDeviceClass.CLASS_A,
          sensorType: this.inferSensorType(deviceData.name, deviceData.description),
          isActive: deviceData.isDisabled !== true,
          lastSeen: deviceData.lastSeenAt ? new Date(deviceData.lastSeenAt) : new Date(0),
          signalStrength: 0,
          spreadingFactor: 7,
          frequency: 915, // Default for US915
          gatewayId: '',
          metadata: deviceData
        };

        this.devices.set(device.deviceEUI, device);
      }

      console.log(`Loaded ${devices.length} LoRaWAN devices`);
    } catch (error) {
      console.error('Failed to fetch LoRaWAN device list:', error);
    }
  }

  private handleMQTTMessage(topic: string, message: Buffer): void {
    try {
      const data = JSON.parse(message.toString());
      const deviceEUI = this.extractDeviceEUIFromTopic(topic);
      
      if (topic.includes('/event/up')) {
        this.handleUplinkMessage(deviceEUI, data);
      } else if (topic.includes('/event/join')) {
        this.handleJoinEvent(deviceEUI, data);
      } else if (topic.includes('/event/status')) {
        this.handleStatusEvent(deviceEUI, data);
      }
    } catch (error) {
      console.error('Error parsing MQTT message:', error);
    }
  }

  private handleUplinkMessage(deviceEUI: string, data: any): void {
    const device = this.devices.get(deviceEUI);
    if (!device) {
      console.warn(`Unknown device: ${deviceEUI}`);
      return;
    }

    // Update device info
    device.lastSeen = new Date(data.rxInfo?.[0]?.time || Date.now());
    device.signalStrength = data.rxInfo?.[0]?.rssi || 0;
    device.spreadingFactor = data.txInfo?.spreadingFactor || 7;
    device.frequency = data.txInfo?.frequency || 915;
    device.gatewayId = data.rxInfo?.[0]?.gatewayID || '';

    // Create uplink message object
    const uplinkMessage: LoRaWANUplinkMessage = {
      deviceEUI,
      timestamp: device.lastSeen,
      messageType: LoRaWANMessageType.UPLINK,
      payload: Buffer.from(data.data, 'base64'),
      port: data.fPort || 1,
      rssi: device.signalStrength,
      snr: data.rxInfo?.[0]?.loRaSNR || 0,
      spreadingFactor: device.spreadingFactor,
      frequency: device.frequency,
      gatewayInfo: data.rxInfo?.map((rx: any) => ({
        gatewayId: rx.gatewayID,
        gatewayEUI: rx.gatewayID, // Assuming same for now
        rssi: rx.rssi,
        snr: rx.loRaSNR,
        location: rx.location ? {
          latitude: rx.location.latitude,
          longitude: rx.location.longitude
        } : undefined
      })) || []
    };

    // Decode payload based on sensor type
    const sensorReading = this.decodePayload(device, uplinkMessage);
    if (sensorReading) {
      console.log(`Sensor reading from ${deviceEUI}:`, sensorReading);
      this.emit('sensorReading', sensorReading);

      // Check for alerts
      if (sensorReading.alertLevel !== 'normal') {
        this.emit('alert', {
          deviceEUI,
          sensorType: device.sensorType,
          alertLevel: sensorReading.alertLevel,
          message: sensorReading.alertMessage,
          timestamp: sensorReading.timestamp,
          readings: sensorReading.readings
        });
      }
    }

    this.emit('uplinkMessage', uplinkMessage);
  }

  private handleJoinEvent(deviceEUI: string, data: any): void {
    console.log(`Device ${deviceEUI} joined LoRaWAN network`);
    
    const device = this.devices.get(deviceEUI);
    if (device) {
      device.isActive = true;
      device.lastSeen = new Date();
    }

    this.emit('deviceJoin', { deviceEUI, timestamp: new Date() });
  }

  private handleStatusEvent(deviceEUI: string, data: any): void {
    console.log(`Status update from ${deviceEUI}:`, data);
    
    const device = this.devices.get(deviceEUI);
    if (device) {
      device.batteryLevel = data.batteryLevel;
      device.lastSeen = new Date();
    }

    this.emit('deviceStatus', { deviceEUI, data, timestamp: new Date() });
  }

  private decodePayload(device: LoRaWANDeviceInfo, message: LoRaWANUplinkMessage): LoRaWANSensorReading | null {
    const payload = message.payload;
    
    try {
      switch (device.sensorType) {
        case LoRaWANSensorType.GPS_TRACKER:
          return this.decodeGPSTracker(device, payload, message.timestamp);
        
        case LoRaWANSensorType.DOOR_SENSOR:
          return this.decodeDoorSensor(device, payload, message.timestamp);
        
        case LoRaWANSensorType.MOTION_DETECTOR:
          return this.decodeMotionDetector(device, payload, message.timestamp);
        
        case LoRaWANSensorType.TEMPERATURE_HUMIDITY:
          return this.decodeTempHumidity(device, payload, message.timestamp);
        
        case LoRaWANSensorType.PANIC_BUTTON:
          return this.decodePanicButton(device, payload, message.timestamp);
        
        case LoRaWANSensorType.FUEL_LEVEL:
          return this.decodeFuelLevel(device, payload, message.timestamp);
        
        default:
          console.warn(`No decoder for sensor type: ${device.sensorType}`);
          return null;
      }
    } catch (error) {
      console.error(`Error decoding payload for ${device.deviceEUI}:`, error);
      return null;
    }
  }

  private decodeGPSTracker(device: LoRaWANDeviceInfo, payload: Buffer, timestamp: Date): LoRaWANSensorReading {
    // Example GPS tracker payload format (customize based on your device)
    const latitude = payload.readInt32BE(0) / 1000000;
    const longitude = payload.readInt32BE(4) / 1000000;
    const batteryLevel = payload.length > 8 ? payload.readUInt8(8) : undefined;

    return {
      deviceEUI: device.deviceEUI,
      timestamp,
      sensorType: device.sensorType,
      readings: {
        gpsLatitude: latitude,
        gpsLongitude: longitude,
        gpsAccuracy: 10, // meters - could be in payload
        batteryLevel
      },
      alertLevel: batteryLevel && batteryLevel < 20 ? 'warning' : 'normal',
      alertMessage: batteryLevel && batteryLevel < 20 ? 'Low battery level' : undefined
    };
  }

  private decodeDoorSensor(device: LoRaWANDeviceInfo, payload: Buffer, timestamp: Date): LoRaWANSensorReading {
    const doorOpen = payload.readUInt8(0) === 1;
    const batteryLevel = payload.length > 1 ? payload.readUInt8(1) : undefined;
    const tamperDetected = payload.length > 2 ? payload.readUInt8(2) === 1 : false;

    return {
      deviceEUI: device.deviceEUI,
      timestamp,
      sensorType: device.sensorType,
      readings: {
        doorOpen,
        batteryLevel,
        tamperDetected
      },
      alertLevel: tamperDetected ? 'critical' : doorOpen ? 'warning' : 'normal',
      alertMessage: tamperDetected ? 'Tamper detected' : doorOpen ? 'Door opened' : undefined
    };
  }

  private decodeMotionDetector(device: LoRaWANDeviceInfo, payload: Buffer, timestamp: Date): LoRaWANSensorReading {
    const motionDetected = payload.readUInt8(0) === 1;
    const batteryLevel = payload.length > 1 ? payload.readUInt8(1) : undefined;

    return {
      deviceEUI: device.deviceEUI,
      timestamp,
      sensorType: device.sensorType,
      readings: {
        motionDetected,
        batteryLevel
      },
      alertLevel: motionDetected ? 'warning' : 'normal',
      alertMessage: motionDetected ? 'Motion detected' : undefined
    };
  }

  private decodeTempHumidity(device: LoRaWANDeviceInfo, payload: Buffer, timestamp: Date): LoRaWANSensorReading {
    const temperature = payload.readInt16BE(0) / 100; // Temperature in Celsius * 100
    const humidity = payload.readUInt16BE(2) / 100; // Humidity percentage * 100
    const batteryLevel = payload.length > 4 ? payload.readUInt8(4) : undefined;

    let alertLevel: 'normal' | 'warning' | 'critical' = 'normal';
    let alertMessage: string | undefined;

    if (temperature < -10 || temperature > 50) {
      alertLevel = 'warning';
      alertMessage = 'Temperature out of normal range';
    }
    if (humidity > 80) {
      alertLevel = 'warning';
      alertMessage = 'High humidity detected';
    }

    return {
      deviceEUI: device.deviceEUI,
      timestamp,
      sensorType: device.sensorType,
      readings: {
        temperature,
        humidity,
        batteryLevel
      },
      alertLevel,
      alertMessage
    };
  }

  private decodePanicButton(device: LoRaWANDeviceInfo, payload: Buffer, timestamp: Date): LoRaWANSensorReading {
    const panicButtonPressed = payload.readUInt8(0) === 1;
    const batteryLevel = payload.length > 1 ? payload.readUInt8(1) : undefined;

    return {
      deviceEUI: device.deviceEUI,
      timestamp,
      sensorType: device.sensorType,
      readings: {
        panicButtonPressed,
        batteryLevel
      },
      alertLevel: panicButtonPressed ? 'emergency' : 'normal',
      alertMessage: panicButtonPressed ? 'EMERGENCY: Panic button activated!' : undefined
    };
  }

  private decodeFuelLevel(device: LoRaWANDeviceInfo, payload: Buffer, timestamp: Date): LoRaWANSensorReading {
    const fuelLevel = payload.readUInt8(0); // percentage
    const batteryLevel = payload.length > 1 ? payload.readUInt8(1) : undefined;

    return {
      deviceEUI: device.deviceEUI,
      timestamp,
      sensorType: device.sensorType,
      readings: {
        fuelLevel,
        batteryLevel
      },
      alertLevel: fuelLevel < 20 ? 'warning' : 'normal',
      alertMessage: fuelLevel < 20 ? 'Low fuel level detected' : undefined
    };
  }

  private inferSensorType(name: string, description?: string): LoRaWANSensorType {
    const text = `${name} ${description || ''}`.toLowerCase();
    
    if (text.includes('gps') || text.includes('tracker')) return LoRaWANSensorType.GPS_TRACKER;
    if (text.includes('door') || text.includes('entry')) return LoRaWANSensorType.DOOR_SENSOR;
    if (text.includes('motion') || text.includes('pir')) return LoRaWANSensorType.MOTION_DETECTOR;
    if (text.includes('temp') || text.includes('humidity')) return LoRaWANSensorType.TEMPERATURE_HUMIDITY;
    if (text.includes('panic') || text.includes('emergency')) return LoRaWANSensorType.PANIC_BUTTON;
    if (text.includes('fuel') || text.includes('tank')) return LoRaWANSensorType.FUEL_LEVEL;
    if (text.includes('generator')) return LoRaWANSensorType.GENERATOR_MONITOR;
    
    return LoRaWANSensorType.ASSET_TAG; // Default
  }

  private extractDeviceEUIFromTopic(topic: string): string {
    const parts = topic.split('/');
    const deviceIndex = parts.indexOf('device');
    return deviceIndex >= 0 && deviceIndex + 1 < parts.length ? parts[deviceIndex + 1] : '';
  }

  // Downlink methods for sending commands to devices
  public async sendDownlinkMessage(deviceEUI: string, port: number, data: Buffer, confirmed: boolean = false): Promise<boolean> {
    try {
      const payload = {
        deviceEUI,
        confirmed,
        fPort: port,
        data: data.toString('base64')
      };

      const response = await axios.post(`${this.networkServerUrl}/api/applications/${this.applicationId}/devices/${deviceEUI}/downlink`, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.status === 200;
    } catch (error) {
      console.error(`Failed to send downlink to ${deviceEUI}:`, error);
      return false;
    }
  }

  public getConnectedDevices(): LoRaWANDeviceInfo[] {
    return Array.from(this.devices.values()).filter(device => device.isActive);
  }

  public getDeviceInfo(deviceEUI: string): LoRaWANDeviceInfo | undefined {
    return this.devices.get(deviceEUI);
  }

  public async shutdown(): Promise<void> {
    if (this.mqttClient) {
      this.mqttClient.end();
      this.mqttClient = null;
    }
    console.log('LoRaWAN Gateway shut down');
  }
}
