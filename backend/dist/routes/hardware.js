"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// Validation middleware
const handleValidation = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    return next();
};
// Mock GPS devices data (shared with vehicles.ts)
let mockGPSDevices = [
    {
        id: 'BW32001',
        imei: '863835030123456',
        simNumber: '+1234567890',
        batteryLevel: 95,
        signalStrength: 85,
        status: 'active',
        lastSeen: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        isAssigned: true,
        assignedVehicleId: 'VH001'
    },
    {
        id: 'BW32002',
        imei: '863835030123457',
        simNumber: '+1234567891',
        batteryLevel: 78,
        signalStrength: 92,
        status: 'active',
        lastSeen: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 minutes ago
        isAssigned: true,
        assignedVehicleId: 'VH002'
    },
    {
        id: 'BW32003',
        imei: '863835030123458',
        simNumber: '+1234567892',
        batteryLevel: 84,
        signalStrength: 76,
        status: 'active',
        lastSeen: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
        isAssigned: false,
        assignedVehicleId: null
    },
    {
        id: 'BW32004',
        imei: '863835030123459',
        simNumber: '+1234567893',
        batteryLevel: 45,
        signalStrength: 68,
        status: 'active',
        lastSeen: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        isAssigned: false,
        assignedVehicleId: null
    },
    {
        id: 'BW32005',
        imei: '863835030123460',
        simNumber: '+1234567894',
        batteryLevel: 12,
        signalStrength: 45,
        status: 'maintenance',
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
        isAssigned: false,
        assignedVehicleId: null
    }
];
// GET /api/hardware/bw32/devices - Get all GPS devices
router.get('/bw32/devices', async (_req, res) => {
    try {
        return res.json({
            success: true,
            devices: mockGPSDevices,
            total: mockGPSDevices.length
        });
    }
    catch (error) {
        console.error('Error fetching GPS devices:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/hardware/bw32/devices/:id - Get single GPS device
router.get('/bw32/devices/:id', [
    (0, express_validator_1.param)('id').notEmpty(),
    handleValidation
], async (req, res) => {
    try {
        const { id } = req.params;
        const device = mockGPSDevices.find(d => d.id === id);
        if (!device) {
            return res.status(404).json({ error: 'GPS device not found' });
        }
        return res.json({
            success: true,
            device
        });
    }
    catch (error) {
        console.error('Error fetching GPS device:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/hardware/bw32/command/:id - Send command to GPS device
router.post('/bw32/command/:id', [
    (0, express_validator_1.param)('id').notEmpty(),
    (0, express_validator_1.body)('command').isIn(['engine_cutoff', 'engine_restore', 'get_location', 'set_geofence', 'request_sos']),
    (0, express_validator_1.body)('parameters').optional().isObject(),
    handleValidation
], async (req, res) => {
    try {
        const { id } = req.params;
        const { command, parameters = {} } = req.body;
        const device = mockGPSDevices.find(d => d.id === id);
        if (!device) {
            return res.status(404).json({ error: 'GPS device not found' });
        }
        if (device.status !== 'active') {
            return res.status(400).json({ error: 'Device is not active and cannot receive commands' });
        }
        console.log(`📤 Sending command '${command}' to GPS device ${id}:`, parameters);
        // Simulate command processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Update device status based on command
        const deviceIndex = mockGPSDevices.findIndex(d => d.id === id);
        if (deviceIndex !== -1) {
            mockGPSDevices[deviceIndex] = {
                ...mockGPSDevices[deviceIndex],
                lastSeen: new Date().toISOString()
            };
        }
        // Simulate different responses based on command
        let commandResult;
        switch (command) {
            case 'engine_cutoff':
                commandResult = {
                    status: 'executed',
                    message: 'Engine cutoff command sent successfully',
                    timestamp: new Date().toISOString()
                };
                break;
            case 'engine_restore':
                commandResult = {
                    status: 'executed',
                    message: 'Engine restore command sent successfully',
                    timestamp: new Date().toISOString()
                };
                break;
            case 'get_location':
                commandResult = {
                    status: 'executed',
                    message: 'Location request sent, data will be available via WebSocket',
                    timestamp: new Date().toISOString(),
                    expectedDataDelay: '5-10 seconds'
                };
                break;
            case 'set_geofence':
                if (!parameters.latitude || !parameters.longitude || !parameters.radius) {
                    return res.status(400).json({ error: 'Geofence command requires latitude, longitude, and radius parameters' });
                }
                commandResult = {
                    status: 'executed',
                    message: 'Geofence boundary set successfully',
                    timestamp: new Date().toISOString(),
                    geofence: {
                        center: [parameters.longitude, parameters.latitude],
                        radius: parameters.radius
                    }
                };
                break;
            case 'request_sos':
                commandResult = {
                    status: 'executed',
                    message: 'SOS signal activated',
                    timestamp: new Date().toISOString(),
                    alert: 'EMERGENCY_SOS_ACTIVATED'
                };
                break;
            default:
                return res.status(400).json({ error: 'Unknown command' });
        }
        return res.json({
            success: true,
            command,
            deviceId: id,
            result: commandResult
        });
    }
    catch (error) {
        console.error('Error sending GPS command:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/hardware/bw32/devices - Register new GPS device
router.post('/bw32/devices', [
    (0, express_validator_1.body)('imei').isLength({ min: 15, max: 15 }).matches(/^\d+$/),
    (0, express_validator_1.body)('simNumber').notEmpty(),
    handleValidation
], async (req, res) => {
    try {
        const { imei, simNumber } = req.body;
        // Check if IMEI already exists
        const existingDevice = mockGPSDevices.find(d => d.imei === imei);
        if (existingDevice) {
            return res.status(400).json({ error: 'Device with this IMEI already registered' });
        }
        const newDevice = {
            id: `BW32${String(mockGPSDevices.length + 1).padStart(3, '0')}`,
            imei,
            simNumber,
            batteryLevel: 100,
            signalStrength: 0, // Will update when device comes online
            status: 'inactive',
            lastSeen: new Date().toISOString(),
            isAssigned: false,
            assignedVehicleId: null
        };
        mockGPSDevices.push(newDevice);
        console.log('Registered new GPS device:', newDevice);
        return res.status(201).json({
            success: true,
            device: newDevice,
            message: 'GPS device registered successfully'
        });
    }
    catch (error) {
        console.error('Error registering GPS device:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/hardware/bw32/devices/:id - Update GPS device status
router.put('/bw32/devices/:id', [
    (0, express_validator_1.param)('id').notEmpty(),
    (0, express_validator_1.body)('status').optional().isIn(['active', 'inactive', 'maintenance']),
    (0, express_validator_1.body)('batteryLevel').optional().isInt({ min: 0, max: 100 }),
    (0, express_validator_1.body)('signalStrength').optional().isInt({ min: 0, max: 100 }),
    handleValidation
], async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const deviceIndex = mockGPSDevices.findIndex(d => d.id === id);
        if (deviceIndex === -1) {
            return res.status(404).json({ error: 'GPS device not found' });
        }
        mockGPSDevices[deviceIndex] = {
            ...mockGPSDevices[deviceIndex],
            ...updates,
            lastSeen: new Date().toISOString()
        };
        console.log('Updated GPS device:', mockGPSDevices[deviceIndex]);
        return res.json({
            success: true,
            device: mockGPSDevices[deviceIndex],
            message: 'GPS device updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating GPS device:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/hardware/bw32/devices/:id - Remove GPS device
router.delete('/bw32/devices/:id', [
    (0, express_validator_1.param)('id').notEmpty(),
    handleValidation
], async (req, res) => {
    try {
        const { id } = req.params;
        const deviceIndex = mockGPSDevices.findIndex(d => d.id === id);
        if (deviceIndex === -1) {
            return res.status(404).json({ error: 'GPS device not found' });
        }
        if (mockGPSDevices[deviceIndex].isAssigned) {
            return res.status(400).json({
                error: 'Cannot remove device that is assigned to a vehicle. Unassign first.'
            });
        }
        const deletedDevice = mockGPSDevices.splice(deviceIndex, 1)[0];
        console.log('Removed GPS device:', deletedDevice);
        return res.json({
            success: true,
            message: 'GPS device removed successfully'
        });
    }
    catch (error) {
        console.error('Error removing GPS device:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/hardware/bw32/status - Get overall BW32 system status
router.get('/bw32/status', async (_req, res) => {
    try {
        const totalDevices = mockGPSDevices.length;
        const activeDevices = mockGPSDevices.filter(d => d.status === 'active').length;
        const assignedDevices = mockGPSDevices.filter(d => d.isAssigned).length;
        const lowBatteryDevices = mockGPSDevices.filter(d => d.batteryLevel < 20).length;
        const offlineDevices = mockGPSDevices.filter(d => {
            const lastSeenTime = new Date(d.lastSeen).getTime();
            const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
            return lastSeenTime < tenMinutesAgo;
        }).length;
        return res.json({
            success: true,
            status: {
                totalDevices,
                activeDevices,
                assignedDevices,
                availableDevices: totalDevices - assignedDevices,
                lowBatteryDevices,
                offlineDevices,
                systemHealth: offlineDevices === 0 && lowBatteryDevices === 0 ? 'good' :
                    lowBatteryDevices > 0 ? 'warning' : 'critical',
                lastUpdated: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error fetching BW32 system status:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=hardware.js.map