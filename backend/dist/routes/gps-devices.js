"use strict";
/**
 * GPS Device Integration API
 * Lantern SOS Tracker integration and management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const mqtt_1 = __importDefault(require("mqtt"));
const auth0Middleware_1 = require("../middleware/auth0Middleware");
const router = express_1.default.Router();
// Database connection
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
// MQTT Client for GPS device communication
const mqttClient = mqtt_1.default.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883', {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
});
mqttClient.on('connect', () => {
    console.log('✅ Connected to MQTT broker for GPS devices');
    // Subscribe to GPS device topics
    mqttClient.subscribe('gps/+/location');
    mqttClient.subscribe('gps/+/status');
    mqttClient.subscribe('gps/+/emergency');
});
mqttClient.on('message', async (topic, message) => {
    try {
        const data = JSON.parse(message.toString());
        const topicParts = topic.split('/');
        const deviceId = topicParts[1];
        const messageType = topicParts[2];
        console.log(`📡 Received ${messageType} from GPS device ${deviceId}:`, data);
        switch (messageType) {
            case 'location':
                await handleLocationUpdate(deviceId, data);
                break;
            case 'status':
                await handleStatusUpdate(deviceId, data);
                break;
            case 'emergency':
                await handleEmergencyAlert(deviceId, data);
                break;
        }
    }
    catch (error) {
        console.error('❌ Error processing GPS device message:', error);
    }
});
// Handle GPS location updates
async function handleLocationUpdate(deviceId, data) {
    try {
        const { latitude, longitude, speed, heading, altitude, accuracy, timestamp } = data;
        // Get device and associated vehicle
        const deviceResult = await pool.query('SELECT * FROM gps_devices WHERE device_id = $1', [deviceId]);
        if (deviceResult.rows.length === 0) {
            console.log(`⚠️ Unknown GPS device: ${deviceId}`);
            return;
        }
        const device = deviceResult.rows[0];
        // Store tracking data
        await pool.query(`INSERT INTO gps_tracking_data (
        device_id, vehicle_id, coordinates, speed, heading, altitude, accuracy, timestamp
      ) VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8, $9)`, [device.id, device.vehicle_id, longitude, latitude, speed, heading, altitude, accuracy, timestamp || new Date()]);
        // Update vehicle location
        if (device.vehicle_id) {
            await pool.query(`UPDATE vehicles SET 
         coordinates = ST_SetSRID(ST_MakePoint($1, $2), 4326),
         last_location = $3,
         updated_at = NOW()
         WHERE id = $4`, [longitude, latitude, `${latitude}, ${longitude}`, device.vehicle_id]);
        }
        console.log(`✅ Updated location for device ${deviceId}: ${latitude}, ${longitude}`);
    }
    catch (error) {
        console.error('❌ Error handling location update:', error);
    }
}
// Handle GPS device status updates
async function handleStatusUpdate(deviceId, data) {
    try {
        const { batteryLevel, signalStrength, engineStatus } = data;
        await pool.query(`UPDATE gps_devices SET 
       battery_level = $1,
       signal_strength = $2,
       last_ping = NOW()
       WHERE device_id = $3`, [batteryLevel, signalStrength, deviceId]);
        // Update vehicle engine status if provided
        if (engineStatus) {
            await pool.query(`UPDATE vehicles SET engine_status = $1 
         WHERE gps_tracker_id = $2`, [engineStatus, deviceId]);
        }
        console.log(`✅ Updated status for device ${deviceId}`);
    }
    catch (error) {
        console.error('❌ Error handling status update:', error);
    }
}
// Handle emergency alerts from GPS devices
async function handleEmergencyAlert(deviceId, data) {
    try {
        const { alertType, latitude, longitude, timestamp } = data;
        console.log(`🚨 EMERGENCY ALERT from device ${deviceId}: ${alertType}`);
        // Get device and vehicle info
        const deviceResult = await pool.query(`
      SELECT d.*, v.name as vehicle_name, v.plate_number, v.current_operator_name 
      FROM gps_devices d 
      LEFT JOIN vehicles v ON d.vehicle_id = v.id 
      WHERE d.device_id = $1
    `, [deviceId]);
        if (deviceResult.rows.length > 0) {
            const device = deviceResult.rows[0];
            // Create emergency notification
            await pool.query(`INSERT INTO notifications (
          type, category, title, message, asset_id, asset_name, department_name, severity, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
                'emergency',
                'vehicle',
                `EMERGENCY: ${alertType.toUpperCase()}`,
                `Emergency alert from ${device.vehicle_name || 'Unknown Vehicle'} (${device.plate_number || 'Unknown Plate'})${device.current_operator_name ? ` - Operator: ${device.current_operator_name}` : ''}`,
                device.vehicle_id,
                device.vehicle_name,
                device.department_name,
                'critical',
                JSON.stringify({ alertType, latitude, longitude, timestamp, deviceId })
            ]);
            console.log(`🚨 Created emergency notification for ${device.vehicle_name || deviceId}`);
        }
    }
    catch (error) {
        console.error('❌ Error handling emergency alert:', error);
    }
}
// GET /api/gps-devices - List all GPS devices
router.get('/', auth0Middleware_1.verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT d.*, v.name as vehicle_name, v.plate_number 
      FROM gps_devices d 
      LEFT JOIN vehicles v ON d.vehicle_id = v.id 
      ORDER BY d.created_at DESC
    `);
        res.json({
            success: true,
            devices: result.rows,
            total: result.rows.length
        });
    }
    catch (error) {
        console.error('❌ Error fetching GPS devices:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// POST /api/gps-devices - Register new GPS device
router.post('/', auth0Middleware_1.verifyToken, async (req, res) => {
    try {
        const { deviceId, imei, phoneNumber, simCardNumber, vehicleId } = req.body;
        if (!deviceId) {
            return res.status(400).json({
                success: false,
                message: 'Device ID is required'
            });
        }
        const insertQuery = `
      INSERT INTO gps_devices (device_id, imei, phone_number, sim_card_number, vehicle_id, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
        const result = await pool.query(insertQuery, [
            deviceId,
            imei,
            phoneNumber,
            simCardNumber,
            vehicleId || null,
            'active'
        ]);
        res.status(201).json({
            success: true,
            device: result.rows[0],
            message: `GPS device ${deviceId} registered successfully`
        });
        console.log(`✅ Registered GPS device: ${deviceId}`);
    }
    catch (error) {
        console.error('❌ Error registering GPS device:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// POST /api/gps-devices/:deviceId/command - Send command to GPS device
router.post('/:deviceId/command', auth0Middleware_1.verifyToken, async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { command, parameters } = req.body;
        console.log(`📡 Sending command to GPS device ${deviceId}:`, command);
        // Validate command
        const allowedCommands = ['engine_kill', 'engine_start', 'get_location', 'emergency_alert', 'set_geofence'];
        if (!allowedCommands.includes(command)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid command'
            });
        }
        // Send command via MQTT
        const commandPayload = {
            command,
            parameters: parameters || {},
            timestamp: new Date().toISOString(),
            requestId: `cmd-${Date.now()}`
        };
        mqttClient.publish(`gps/${deviceId}/command`, JSON.stringify(commandPayload));
        // Log command in database
        await pool.query('INSERT INTO audit_logs (user_id, user_email, action, resource_type, resource_id, new_values) VALUES ($1, $2, $3, $4, $5, $6)', [req.user?.id, req.user?.email, 'GPS_COMMAND', 'gps_device', deviceId, JSON.stringify(commandPayload)]);
        res.json({
            success: true,
            message: `Command ${command} sent to device ${deviceId}`,
            requestId: commandPayload.requestId
        });
        console.log(`✅ Command sent to GPS device ${deviceId}: ${command}`);
    }
    catch (error) {
        console.error('❌ Error sending GPS command:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// GET /api/gps-devices/:deviceId/tracking - Get vehicle tracking history
router.get('/:deviceId/tracking', auth0Middleware_1.verifyToken, async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { hours = 24 } = req.query;
        const result = await pool.query(`
      SELECT 
        ST_X(coordinates) as longitude,
        ST_Y(coordinates) as latitude,
        speed,
        heading,
        altitude,
        accuracy,
        timestamp
      FROM gps_tracking_data gtd
      JOIN gps_devices gd ON gtd.device_id = gd.id
      WHERE gd.device_id = $1 
        AND gtd.timestamp > NOW() - INTERVAL '${hours} hours'
      ORDER BY gtd.timestamp DESC
      LIMIT 1000
    `, [deviceId]);
        res.json({
            success: true,
            tracking: result.rows,
            deviceId,
            hours: parseInt(hours),
            total: result.rows.length
        });
    }
    catch (error) {
        console.error('❌ Error fetching tracking data:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=gps-devices.js.map