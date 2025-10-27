/**
 * BW32 GPS Tracker Ingestor
 * Handles TCP socket communication with BW32 GPS trackers
 * Based on Benway Communication Protocol v2.7
 */

const net = require('net');
const EventEmitter = require('events');

class BW32Ingestor extends EventEmitter {
  constructor({ port = 50100 }) {
    super();
    this.port = port;
    this.server = null;
    this.activeConnections = new Map();
  }

  start() {
    this.server = net.createServer((socket) => this.handleConnection(socket));
    
    this.server.listen(this.port, () => {
      console.log(`🛰️ BW32 GPS Ingestor started on port ${this.port}`);
      console.log(`📡 Waiting for GPS tracker connections...`);
    });

    this.server.on('error', (error) => {
      console.error('🚨 GPS Ingestor server error:', error);
      this.emit('error', error);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log('🛑 BW32 GPS Ingestor stopped');
    }
  }

  handleConnection(socket) {
    const clientInfo = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`🔌 New GPS tracker connection: ${clientInfo}`);
    
    let buffer = Buffer.alloc(0);
    let deviceId = null;

    socket.on('data', (chunk) => {
      try {
        // Log raw received data for debugging
        const rawData = chunk.toString('hex');
        const rawAscii = chunk.toString('ascii', 0, 100);
        console.log(`📥 Raw data received: ${rawData.substring(0, 100)}...`);
        console.log(`📥 Raw ASCII: ${rawAscii}`);
        
        buffer = Buffer.concat([buffer, chunk]);
        
        // Process BW ASCII frames (end with '#')
        while (true) {
          const frameEnd = buffer.indexOf(0x23); // '#'
          if (frameEnd === -1) break;
          
          const frame = buffer.slice(0, frameEnd + 1);
          buffer = buffer.slice(frameEnd + 1);
          
          const message = this.parseBWFrame(frame);
          if (message) {
            deviceId = message.deviceId;
            this.processMessage(socket, message);
          }
        }

        // Prevent buffer overflow
        if (buffer.length > 8192) {
          console.warn(`⚠️ Buffer overflow for ${clientInfo}, clearing buffer`);
          buffer = Buffer.alloc(0);
        }
      } catch (error) {
        console.error(`🚨 Error processing data from ${clientInfo}:`, error);
      }
    });

    socket.on('close', () => {
      console.log(`📡 GPS tracker disconnected: ${clientInfo} (Device: ${deviceId || 'Unknown'})`);
      if (deviceId) {
        this.activeConnections.delete(deviceId);
      }
    });

    socket.on('error', (error) => {
      console.error(`🚨 Socket error for ${clientInfo}:`, error);
    });

    // Store connection for device management
    if (deviceId) {
      this.activeConnections.set(deviceId, socket);
    }
  }

  /**
   * Parse BW ASCII Protocol Frame
   * Format: BW*<deviceId>*<len>*<CMD>,<payload>#
   */
  parseBWFrame(frame) {
    try {
      const frameStr = frame.toString('utf8').trim();
      
      if (!frameStr.startsWith('BW*') || !frameStr.endsWith('#')) {
        console.warn('⚠️ Invalid BW frame format:', frameStr);
        return null;
      }

      // Remove 'BW*' prefix and '#' suffix
      const content = frameStr.slice(3, -1);
      const parts = content.split('*');
      
      if (parts.length < 3) {
        console.warn('⚠️ Invalid BW frame parts:', frameStr);
        return null;
      }

      const deviceId = parts[0];
      const length = parts[1];
      const cmdAndPayload = parts.slice(2).join('*');
      const [cmd, payload = ''] = cmdAndPayload.split(',', 2);

      return {
        deviceId,
        length: parseInt(length),
        cmd,
        payload,
        raw: frameStr
      };
    } catch (error) {
      console.error('🚨 BW frame parse error:', error);
      return null;
    }
  }

  /**
   * Process parsed BW message and send appropriate ACK
   */
  processMessage(socket, message) {
    const { deviceId, cmd, payload, raw } = message;
    
    console.log(`📨 Message from ${deviceId}: ${cmd} - ${payload}`);
    
    switch (cmd) {
      case 'LK':
        // Heartbeat - send ACK
        this.sendAck(socket, 'ON');
        this.emit('heartbeat', { deviceId, timestamp: new Date().toISOString() });
        break;
        
      case 'UD':
      case 'UD2':
        // Position data
        const position = this.parsePositionData(deviceId, payload);
        if (position) {
          this.emit('position', position);
          this.sendAck(socket, 'OK'); // Some devices expect position ACK
        }
        break;
        
      case 'AL':
        // Alarm
        const alarm = this.parsePositionData(deviceId, payload);
        if (alarm) {
          alarm.eventType = 'alarm';
          this.emit('alarm', alarm);
          this.sendAck(socket, 'AL,OK');
        }
        break;
        
      default:
        console.warn(`⚠️ Unknown command: ${cmd} from ${deviceId}`);
        this.emit('unknown', { deviceId, cmd, payload, raw });
    }
  }

  /**
   * Parse position data from UD/UD2/AL payload
   * Format: YYMMDD,hhmmss,A,lat,NS,lon,EW,speed,course[,additional fields]
   */
  parsePositionData(deviceId, payload) {
    try {
      const fields = payload.split(',');
      if (fields.length < 9) {
        console.warn(`⚠️ Invalid position data length for ${deviceId}:`, payload);
        return null;
      }

      const [
        dateStr,     // YYMMDD
        timeStr,     // hhmmss
        validity,    // A=valid, V=invalid
        latStr,      // DDMM.MMMM
        latHemi,     // N/S
        lonStr,      // DDDMM.MMMM
        lonHemi,     // E/W
        speedStr,    // Knots
        courseStr    // Degrees
      ] = fields;

      // Parse date/time (UTC)
      const year = 2000 + parseInt(dateStr.slice(0, 2));
      const month = parseInt(dateStr.slice(2, 4));
      const day = parseInt(dateStr.slice(4, 6));
      const hour = parseInt(timeStr.slice(0, 2));
      const minute = parseInt(timeStr.slice(2, 4));
      const second = parseInt(timeStr.slice(4, 6));
      
      const fixTime = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

      // Convert coordinates to decimal degrees
      const latitude = this.ddmmToDecimal(parseFloat(latStr), latHemi);
      const longitude = this.ddmmToDecimal(parseFloat(lonStr), lonHemi);
      
      // Convert speed from knots to km/h
      const speedKph = parseFloat(speedStr) * 1.852;
      const courseDeg = parseFloat(courseStr);

      return {
        deviceId,
        fixTimeUtc: fixTime.toISOString(),
        latitude,
        longitude,
        speedKph,
        courseDeg,
        gpsValid: validity === 'A',
        satellites: fields[9] ? parseInt(fields[9]) : null,
        altitude: fields[10] ? parseFloat(fields[10]) : null,
        raw: payload,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`🚨 Position parse error for ${deviceId}:`, error);
      return null;
    }
  }

  /**
   * Convert DDMM.MMMM format to decimal degrees
   */
  ddmmToDecimal(ddmm, hemisphere) {
    if (isNaN(ddmm)) return null;
    
    const degrees = Math.floor(ddmm / 100);
    const minutes = ddmm - (degrees * 100);
    let decimal = degrees + (minutes / 60);
    
    if (hemisphere === 'S' || hemisphere === 'W') {
      decimal = -decimal;
    }
    
    return decimal;
  }

  /**
   * Send ACK response to GPS tracker
   */
  sendAck(socket, ackMessage) {
    try {
      socket.write(ackMessage);
      console.log(`✅ ACK sent: ${ackMessage}`);
    } catch (error) {
      console.error('🚨 Error sending ACK:', error);
    }
  }

  /**
   * Get active connections count
   */
  getActiveConnections() {
    return this.activeConnections.size;
  }

  /**
   * Get connection info
   */
  getConnectionInfo() {
    const connections = [];
    this.activeConnections.forEach((socket, deviceId) => {
      connections.push({
        deviceId,
        remoteAddress: socket.remoteAddress,
        remotePort: socket.remotePort,
        connectedAt: socket.connectedAt || new Date().toISOString()
      });
    });
    return connections;
  }
}

module.exports = BW32Ingestor;
