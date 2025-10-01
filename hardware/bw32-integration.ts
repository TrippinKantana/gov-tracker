/**
 * BW32 GPS Tracker Integration
 * Handles communication with Benway BW32 Mini GPS Trackers
 * Supports GSM/GPRS/2G/4G connectivity with real-time positioning
 */

import { EventEmitter } from 'events';
import net from 'net';

// BW32 Message Types
export enum BW32MessageType {
  LOGIN = '01',
  HEARTBEAT = '13',
  LOCATION = '12',
  ALARM = '16',
  SOS = '99',
  ENGINE_CUTOFF_RESPONSE = '17',
  COMMAND_RESPONSE = '15'
}

// BW32 Alarm Types
export enum BW32AlarmType {
  SOS = 1,
  POWER_CUT = 2,
  VIBRATION = 3,
  ENTER_GEOFENCE = 4,
  EXIT_GEOFENCE = 5,
  OVERSPEED = 6,
  MOVEMENT = 7,
  LOW_BATTERY = 8,
  ENGINE_OFF = 9,
  ENGINE_ON = 10,
  DOOR_OPEN = 11,
  DOOR_CLOSE = 12
}

export interface BW32LocationData {
  deviceId: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  course: number; // degrees
  altitude: number; // meters
  satellites: number;
  gsmSignal: number;
  battery: number; // percentage
  acc: boolean; // ignition status
  gpsFixed: boolean;
  mileage: number; // total km
}

export interface BW32AlarmData extends BW32LocationData {
  alarmType: BW32AlarmType;
  alarmMessage: string;
}

export interface BW32DeviceInfo {
  deviceId: string;
  imei: string;
  softwareVersion: string;
  hardwareVersion: string;
  lastSeen: Date;
  isOnline: boolean;
}

export class BW32Integration extends EventEmitter {
  private server: net.Server;
  private clients: Map<string, net.Socket> = new Map();
  private devices: Map<string, BW32DeviceInfo> = new Map();
  private port: number;

  constructor(port: number = 8841) {
    super();
    this.port = port;
    this.server = net.createServer();
    this.setupServer();
  }

  private setupServer(): void {
    this.server.on('connection', (socket) => {
      console.log(`BW32 connection established from ${socket.remoteAddress}`);
      
      socket.on('data', (data) => {
        try {
          this.processMessage(socket, data);
        } catch (error) {
          console.error('Error processing BW32 message:', error);
        }
      });

      socket.on('close', () => {
        console.log('BW32 connection closed');
        this.handleDisconnection(socket);
      });

      socket.on('error', (error) => {
        console.error('BW32 socket error:', error);
      });
    });
  }

  private processMessage(socket: net.Socket, buffer: Buffer): void {
    const message = buffer.toString('hex');
    console.log('Received BW32 message:', message);

    // Parse message header (standard BW32 protocol)
    if (message.length < 16) {
      console.warn('Invalid BW32 message length');
      return;
    }

    const header = message.substring(0, 4); // Start bits
    const length = parseInt(message.substring(4, 8), 16);
    const protocol = message.substring(8, 10);
    const deviceId = this.extractDeviceId(message);

    switch (protocol) {
      case BW32MessageType.LOGIN:
        this.handleLogin(socket, message, deviceId);
        break;
      
      case BW32MessageType.HEARTBEAT:
        this.handleHeartbeat(socket, deviceId);
        break;
      
      case BW32MessageType.LOCATION:
        this.handleLocationData(socket, message, deviceId);
        break;
      
      case BW32MessageType.ALARM:
        this.handleAlarm(socket, message, deviceId);
        break;

      case BW32MessageType.SOS:
        this.handleSOS(socket, message, deviceId);
        break;

      default:
        console.log(`Unknown BW32 protocol: ${protocol}`);
    }
  }

  private extractDeviceId(message: string): string {
    // Extract IMEI from message (varies by message type)
    // This is a simplified extraction - actual implementation depends on BW32 protocol spec
    return message.substring(10, 26); // 8-byte IMEI in hex
  }

  private handleLogin(socket: net.Socket, message: string, deviceId: string): void {
    console.log(`BW32 device login: ${deviceId}`);
    
    // Store device connection
    this.clients.set(deviceId, socket);
    
    // Extract device info
    const deviceInfo: BW32DeviceInfo = {
      deviceId,
      imei: deviceId,
      softwareVersion: '1.0.0', // Extract from message
      hardwareVersion: '1.0.0', // Extract from message
      lastSeen: new Date(),
      isOnline: true
    };
    
    this.devices.set(deviceId, deviceInfo);
    
    // Send login response
    const response = this.buildLoginResponse(deviceId);
    socket.write(Buffer.from(response, 'hex'));
    
    this.emit('deviceLogin', deviceInfo);
  }

  private handleLocationData(socket: net.Socket, message: string, deviceId: string): void {
    const locationData = this.parseLocationMessage(message, deviceId);
    
    // Update device last seen
    const device = this.devices.get(deviceId);
    if (device) {
      device.lastSeen = new Date();
      this.devices.set(deviceId, device);
    }

    console.log(`Location update from ${deviceId}:`, locationData);
    this.emit('locationUpdate', locationData);

    // Send acknowledgment
    const ack = this.buildLocationAck(deviceId);
    socket.write(Buffer.from(ack, 'hex'));
  }

  private handleAlarm(socket: net.Socket, message: string, deviceId: string): void {
    const alarmData = this.parseAlarmMessage(message, deviceId);
    
    console.log(`ALARM from ${deviceId}:`, alarmData);
    this.emit('alarm', alarmData);

    // Send alarm acknowledgment
    const ack = this.buildAlarmAck(deviceId);
    socket.write(Buffer.from(ack, 'hex'));
  }

  private handleSOS(socket: net.Socket, message: string, deviceId: string): void {
    const sosData = this.parseAlarmMessage(message, deviceId);
    sosData.alarmType = BW32AlarmType.SOS;
    sosData.alarmMessage = 'SOS Emergency Alert';
    
    console.log(`🚨 SOS EMERGENCY from ${deviceId}:`, sosData);
    this.emit('sos', sosData);

    // Immediate acknowledgment for SOS
    const ack = this.buildSOSAck(deviceId);
    socket.write(Buffer.from(ack, 'hex'));
  }

  private handleHeartbeat(socket: net.Socket, deviceId: string): void {
    // Update device last seen
    const device = this.devices.get(deviceId);
    if (device) {
      device.lastSeen = new Date();
      this.devices.set(deviceId, device);
    }

    // Send heartbeat response
    const response = this.buildHeartbeatResponse(deviceId);
    socket.write(Buffer.from(response, 'hex'));
  }

  private parseLocationMessage(message: string, deviceId: string): BW32LocationData {
    // Parse BW32 location message format
    // This is a simplified parser - actual implementation needs full BW32 protocol spec
    
    const timestamp = this.parseTimestamp(message.substring(26, 38));
    const latitude = this.parseCoordinate(message.substring(38, 46)) / 1800000;
    const longitude = this.parseCoordinate(message.substring(46, 54)) / 1800000;
    const speed = parseInt(message.substring(54, 58), 16);
    const course = parseInt(message.substring(58, 62), 16);
    const statusInfo = parseInt(message.substring(62, 70), 16);
    
    return {
      deviceId,
      timestamp,
      latitude,
      longitude,
      speed,
      course,
      altitude: 0, // Parse from extended data if available
      satellites: (statusInfo >> 16) & 0xFF,
      gsmSignal: (statusInfo >> 8) & 0xFF,
      battery: statusInfo & 0xFF,
      acc: (statusInfo & 0x20000) !== 0,
      gpsFixed: (statusInfo & 0x10000) !== 0,
      mileage: 0 // Parse from extended data if available
    };
  }

  private parseAlarmMessage(message: string, deviceId: string): BW32AlarmData {
    const locationData = this.parseLocationMessage(message, deviceId);
    const alarmType = parseInt(message.substring(70, 72), 16) as BW32AlarmType;
    
    return {
      ...locationData,
      alarmType,
      alarmMessage: this.getAlarmMessage(alarmType)
    };
  }

  private parseTimestamp(hex: string): Date {
    const year = 2000 + parseInt(hex.substring(0, 2), 16);
    const month = parseInt(hex.substring(2, 4), 16) - 1;
    const day = parseInt(hex.substring(4, 6), 16);
    const hour = parseInt(hex.substring(6, 8), 16);
    const minute = parseInt(hex.substring(8, 10), 16);
    const second = parseInt(hex.substring(10, 12), 16);
    
    return new Date(year, month, day, hour, minute, second);
  }

  private parseCoordinate(hex: string): number {
    return parseInt(hex, 16);
  }

  private getAlarmMessage(alarmType: BW32AlarmType): string {
    const messages = {
      [BW32AlarmType.SOS]: 'SOS Emergency Alert',
      [BW32AlarmType.POWER_CUT]: 'Power Disconnected',
      [BW32AlarmType.VIBRATION]: 'Vibration Detected',
      [BW32AlarmType.ENTER_GEOFENCE]: 'Entered Geofence',
      [BW32AlarmType.EXIT_GEOFENCE]: 'Exited Geofence',
      [BW32AlarmType.OVERSPEED]: 'Speed Limit Exceeded',
      [BW32AlarmType.MOVEMENT]: 'Unauthorized Movement',
      [BW32AlarmType.LOW_BATTERY]: 'Low Battery Warning',
      [BW32AlarmType.ENGINE_OFF]: 'Engine Turned Off',
      [BW32AlarmType.ENGINE_ON]: 'Engine Started',
      [BW32AlarmType.DOOR_OPEN]: 'Door Opened',
      [BW32AlarmType.DOOR_CLOSE]: 'Door Closed'
    };
    
    return messages[alarmType] || `Unknown Alarm (${alarmType})`;
  }

  // Command methods for remote control
  public async cutOffEngine(deviceId: string): Promise<boolean> {
    const socket = this.clients.get(deviceId);
    if (!socket) {
      console.error(`Device ${deviceId} not connected`);
      return false;
    }

    const command = this.buildEngineCutOffCommand(deviceId);
    socket.write(Buffer.from(command, 'hex'));
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 10000);
      
      this.once('commandResponse', (response) => {
        clearTimeout(timeout);
        resolve(response.success);
      });
    });
  }

  public async restoreEngine(deviceId: string): Promise<boolean> {
    const socket = this.clients.get(deviceId);
    if (!socket) {
      console.error(`Device ${deviceId} not connected`);
      return false;
    }

    const command = this.buildEngineRestoreCommand(deviceId);
    socket.write(Buffer.from(command, 'hex'));
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 10000);
      
      this.once('commandResponse', (response) => {
        clearTimeout(timeout);
        resolve(response.success);
      });
    });
  }

  // Protocol message builders
  private buildLoginResponse(deviceId: string): string {
    return '787805010001D9DC0D0A'; // Standard BW32 login ACK
  }

  private buildHeartbeatResponse(deviceId: string): string {
    return '787805130001D9DC0D0A'; // Standard heartbeat ACK
  }

  private buildLocationAck(deviceId: string): string {
    return '787805120001D9DC0D0A'; // Standard location ACK
  }

  private buildAlarmAck(deviceId: string): string {
    return '787805160001D9DC0D0A'; // Standard alarm ACK
  }

  private buildSOSAck(deviceId: string): string {
    return '787805990001D9DC0D0A'; // SOS acknowledgment
  }

  private buildEngineCutOffCommand(deviceId: string): string {
    // Build engine cutoff command - actual format depends on BW32 spec
    return '787812800C0000000052454C41592C3100009E7A0D0A';
  }

  private buildEngineRestoreCommand(deviceId: string): string {
    // Build engine restore command
    return '787812800C0000000052454C41592C3000009D8A0D0A';
  }

  private handleDisconnection(socket: net.Socket): void {
    // Find and remove disconnected device
    for (const [deviceId, clientSocket] of this.clients.entries()) {
      if (clientSocket === socket) {
        this.clients.delete(deviceId);
        
        const device = this.devices.get(deviceId);
        if (device) {
          device.isOnline = false;
          this.devices.set(deviceId, device);
        }
        
        this.emit('deviceDisconnect', deviceId);
        break;
      }
    }
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`BW32 Integration Server listening on port ${this.port}`);
          resolve();
        }
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('BW32 Integration Server stopped');
        resolve();
      });
    });
  }

  public getConnectedDevices(): BW32DeviceInfo[] {
    return Array.from(this.devices.values()).filter(device => device.isOnline);
  }

  public getDeviceInfo(deviceId: string): BW32DeviceInfo | undefined {
    return this.devices.get(deviceId);
  }
}
