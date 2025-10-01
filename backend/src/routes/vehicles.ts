import express from 'express';
import { body, param, query, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const handleValidation = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  return next();
};

// Mock vehicle data (replace with database in production)
let mockVehicles = [
  {
    id: 'VH001',
    plateNumber: 'LBR-001-GOV',
    vehicleType: 'truck',
    make: 'Toyota',
    model: 'Hilux',
    year: 2023,
    color: 'White',
    vinNumber: '1HGBH41JXMN109186',
    status: 'active',
    department: 'Ministry of Health',
    departmentId: 'DEPT001',
    assignedEmployeeId: 'EMP001',
    currentOperator: 'Dr. Sarah Johnson',
    assignedEmployee: {
      id: 'EMP001',
      name: 'Dr. Sarah Johnson',
      badgeNumber: 'GSA-001'
    },
    gpsTrackerEnabled: true,
    gpsTrackerId: 'BW32001',
    gpsTracker: 'BW32001',
    fuelLevel: 75,
    mileage: 12500,
    lastLocation: 'Ministry of Health HQ',
    lastMaintenance: '2024-01-01',
    nextMaintenance: '2024-04-01',
    lastUpdate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'VH002',
    plateNumber: 'LBR-002-GOV',
    vehicleType: 'car',
    make: 'Nissan',
    model: 'Patrol',
    year: 2022,
    color: 'Black',
    vinNumber: '2HGBH41JXMN109187',
    status: 'active',
    department: 'Ministry of Defense',
    departmentId: 'DEPT004',
    assignedEmployeeId: 'EMP008',
    currentOperator: 'General Robert Smith',
    assignedEmployee: {
      id: 'EMP008',
      name: 'General Robert Smith',
      badgeNumber: 'GSA-008'
    },
    gpsTrackerEnabled: true,
    gpsTrackerId: 'BW32002',
    gpsTracker: 'BW32002',
    fuelLevel: 45,
    mileage: 28500,
    lastLocation: 'Defense Ministry HQ',
    lastMaintenance: '2023-12-01',
    nextMaintenance: '2024-03-01',
    lastUpdate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET /api/vehicles - Get all vehicles with filtering
router.get('/',
  [
    query('search').optional().isString(),
    query('vehicleType').optional().isIn(['car', 'truck', 'motorcycle', 'bus', 'van', 'suv']),
    query('status').optional().isIn(['active', 'parked', 'maintenance', 'alert']),
    query('department').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
    handleValidation
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const { search, vehicleType, status, department, limit = 100, offset = 0 } = req.query;
      
      let filteredVehicles = [...mockVehicles];
      
      // Apply filters
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.plateNumber.toLowerCase().includes(searchTerm) ||
          vehicle.make.toLowerCase().includes(searchTerm) ||
          vehicle.model.toLowerCase().includes(searchTerm) ||
          vehicle.department.toLowerCase().includes(searchTerm) ||
          vehicle.vinNumber.toLowerCase().includes(searchTerm) ||
          (vehicle.assignedEmployee && vehicle.assignedEmployee.name.toLowerCase().includes(searchTerm))
        );
      }
      
      if (vehicleType) {
        filteredVehicles = filteredVehicles.filter(vehicle => vehicle.vehicleType === vehicleType);
      }
      
      if (status) {
        filteredVehicles = filteredVehicles.filter(vehicle => vehicle.status === status);
      }
      
      if (department) {
        filteredVehicles = filteredVehicles.filter(vehicle => vehicle.department === department);
      }
      
      // Apply pagination
      const total = filteredVehicles.length;
      const paginatedVehicles = filteredVehicles.slice(
        Number(offset), 
        Number(offset) + Number(limit)
      );
      
      return res.json({
        success: true,
        vehicles: paginatedVehicles,
        total,
        offset: Number(offset),
        limit: Number(limit)
      });
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/vehicles/:id - Get single vehicle
router.get('/:id',
  [
    param('id').notEmpty(),
    handleValidation
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const vehicle = mockVehicles.find(v => v.id === id);
      
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      
      return res.json({
        success: true,
        vehicle
      });
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/vehicles - Create new vehicle
router.post('/',
  [
    body('plateNumber').notEmpty().isLength({ min: 1, max: 20 }),
    body('vehicleType').isIn(['car', 'truck', 'motorcycle', 'bus', 'van', 'suv']),
    body('make').notEmpty().isLength({ min: 1, max: 100 }),
    body('model').notEmpty().isLength({ min: 1, max: 100 }),
    body('year').isInt({ min: 1990, max: new Date().getFullYear() + 1 }),
    body('color').optional().isLength({ max: 50 }),
    body('vinNumber').notEmpty().isLength({ min: 17, max: 17 }),
    body('status').isIn(['active', 'parked', 'maintenance', 'alert']),
    body('department').notEmpty().isLength({ min: 1, max: 255 }),
    body('departmentId').notEmpty(),
    body('assignedEmployeeId').optional().isString(),
    handleValidation
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const vehicleData = req.body;
      
      // Check if plate number already exists
      const existingPlate = mockVehicles.find(v => v.plateNumber === vehicleData.plateNumber);
      if (existingPlate) {
        return res.status(400).json({ error: 'Plate number already exists' });
      }
      
      // Check if VIN already exists
      const existingVin = mockVehicles.find(v => v.vinNumber === vehicleData.vinNumber);
      if (existingVin) {
        return res.status(400).json({ error: 'VIN number already exists' });
      }
      
      // Generate GPS tracker ID
      const gpsTrackerId = `BW32${String(mockVehicles.length + 1).padStart(3, '0')}`;
      
      const newVehicle = {
        id: vehicleData.id || `VH${String(mockVehicles.length + 1).padStart(3, '0')}`,
        ...vehicleData,
        gpsTrackerEnabled: true,
        gpsTrackerId,
        fuelLevel: vehicleData.fuelLevel || 100,
        mileage: vehicleData.mileage || 0,
        lastLocation: `${vehicleData.department} - Motor Pool`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // If employee is assigned, add employee details
      if (vehicleData.assignedEmployeeId) {
        // In a real app, you'd fetch this from the employees table
        newVehicle.assignedEmployee = {
          id: vehicleData.assignedEmployeeId,
          name: 'Employee Name', // Would be fetched from database
          badgeNumber: 'GSA-XXX' // Would be fetched from database
        };
      }
      
      mockVehicles.push(newVehicle);
      
      console.log('Created new vehicle:', newVehicle);
      
      return res.status(201).json({
        success: true,
        vehicle: newVehicle,
        message: 'Vehicle created successfully'
      });
    } catch (error) {
      console.error('Error creating vehicle:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id',
  [
    param('id').notEmpty(),
    body('plateNumber').optional().isLength({ min: 1, max: 20 }),
    body('vehicleType').optional().isIn(['car', 'truck', 'motorcycle', 'bus', 'van', 'suv']),
    body('status').optional().isIn(['active', 'parked', 'maintenance', 'alert']),
    body('fuelLevel').optional().isInt({ min: 0, max: 100 }),
    body('mileage').optional().isInt({ min: 0 }),
    handleValidation
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const vehicleIndex = mockVehicles.findIndex(v => v.id === id);
      if (vehicleIndex === -1) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      
      mockVehicles[vehicleIndex] = {
        ...mockVehicles[vehicleIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      console.log('Updated vehicle:', mockVehicles[vehicleIndex]);
      
      return res.json({
        success: true,
        vehicle: mockVehicles[vehicleIndex],
        message: 'Vehicle updated successfully'
      });
    } catch (error) {
      console.error('Error updating vehicle:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id',
  [
    param('id').notEmpty(),
    handleValidation
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      
      const vehicleIndex = mockVehicles.findIndex(v => v.id === id);
      if (vehicleIndex === -1) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      
      const deletedVehicle = mockVehicles.splice(vehicleIndex, 1)[0];
      
      console.log('Deleted vehicle:', deletedVehicle);
      
      return res.json({
        success: true,
        message: 'Vehicle deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/vehicles/:id/track - Start/update vehicle tracking
router.post('/:id/track',
  [
    param('id').notEmpty(),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('speed').optional().isFloat({ min: 0 }),
    body('heading').optional().isFloat({ min: 0, max: 360 }),
    body('fuelLevel').optional().isInt({ min: 0, max: 100 }),
    handleValidation
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const trackingData = req.body;
      
      const vehicle = mockVehicles.find(v => v.id === id);
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      
      // Update vehicle location and status
      const vehicleIndex = mockVehicles.findIndex(v => v.id === id);
      mockVehicles[vehicleIndex] = {
        ...mockVehicles[vehicleIndex],
        lastLocation: `GPS: ${trackingData.latitude}, ${trackingData.longitude}`,
        fuelLevel: trackingData.fuelLevel || mockVehicles[vehicleIndex].fuelLevel,
        updatedAt: new Date().toISOString()
      };
      
      console.log('Updated vehicle tracking:', trackingData);
      
      return res.json({
        success: true,
        message: 'Vehicle tracking updated',
        trackingData
      });
    } catch (error) {
      console.error('Error updating vehicle tracking:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Mock GPS devices data
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
  }
];

// Mock maintenance records data
let mockMaintenanceRecords = [
  {
    id: 'MAINT001',
    vehicleId: 'VH001',
    type: 'Oil Change',
    description: 'Regular oil change and filter replacement',
    date: '2024-01-01',
    mileage: 12000,
    cost: 75.50,
    provider: 'GSA Motor Pool',
    status: 'completed',
    parts: ['Oil Filter', '5L Engine Oil'],
    notes: 'Routine maintenance completed successfully',
    nextDueDate: '2024-04-01',
    nextDueMileage: 17000
  },
  {
    id: 'MAINT002',
    vehicleId: 'VH001',
    type: 'Tire Rotation',
    description: 'Rotated all four tires and checked pressure',
    date: '2023-12-15',
    mileage: 11500,
    cost: 25.00,
    provider: 'GSA Motor Pool',
    status: 'completed',
    parts: [],
    notes: 'Tire pressure adjusted to specification'
  }
];

// POST /api/vehicles/:id/assign-tracker - Assign GPS tracker to vehicle
router.post('/:id/assign-tracker',
  [
    param('id').notEmpty(),
    body('trackerId').notEmpty(),
    handleValidation
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { trackerId } = req.body;
      
      const vehicleIndex = mockVehicles.findIndex(v => v.id === id);
      if (vehicleIndex === -1) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      
      const deviceIndex = mockGPSDevices.findIndex(d => d.id === trackerId);
      if (deviceIndex === -1) {
        return res.status(404).json({ error: 'GPS device not found' });
      }
      
      if (mockGPSDevices[deviceIndex].isAssigned) {
        return res.status(400).json({ error: 'GPS device already assigned to another vehicle' });
      }
      
      // Update vehicle
      mockVehicles[vehicleIndex] = {
        ...mockVehicles[vehicleIndex],
        gpsTracker: trackerId,
        gpsTrackerId: trackerId,
        gpsTrackerEnabled: true,
        updatedAt: new Date().toISOString()
      };
      
      // Update device
      mockGPSDevices[deviceIndex] = {
        ...mockGPSDevices[deviceIndex],
        isAssigned: true,
        assignedVehicleId: id
      };
      
      console.log(`Assigned GPS tracker ${trackerId} to vehicle ${id}`);
      
      return res.json({
        success: true,
        message: 'GPS tracker assigned successfully'
      });
    } catch (error) {
      console.error('Error assigning GPS tracker:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/vehicles/:id/unassign-tracker - Unassign GPS tracker from vehicle
router.post('/:id/unassign-tracker',
  [
    param('id').notEmpty(),
    handleValidation
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      
      const vehicleIndex = mockVehicles.findIndex(v => v.id === id);
      if (vehicleIndex === -1) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      
      const currentTrackerId = mockVehicles[vehicleIndex].gpsTracker || mockVehicles[vehicleIndex].gpsTrackerId;
      if (!currentTrackerId) {
        return res.status(400).json({ error: 'No GPS tracker assigned to this vehicle' });
      }
      
      // Update device
      const deviceIndex = mockGPSDevices.findIndex(d => d.id === currentTrackerId);
      if (deviceIndex !== -1) {
        mockGPSDevices[deviceIndex] = {
          ...mockGPSDevices[deviceIndex],
          isAssigned: false,
          assignedVehicleId: null
        };
      }
      
      // Update vehicle  
      const updatedVehicle = { ...mockVehicles[vehicleIndex] };
      delete (updatedVehicle as any).gpsTracker;
      delete (updatedVehicle as any).gpsTrackerId;
      updatedVehicle.gpsTrackerEnabled = false;
      updatedVehicle.updatedAt = new Date().toISOString();
      mockVehicles[vehicleIndex] = updatedVehicle;
      
      console.log(`Unassigned GPS tracker ${currentTrackerId} from vehicle ${id}`);
      
      return res.json({
        success: true,
        message: 'GPS tracker unassigned successfully'
      });
    } catch (error) {
      console.error('Error unassigning GPS tracker:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/vehicles/:id/maintenance - Get maintenance records for vehicle
router.get('/:id/maintenance',
  [
    param('id').notEmpty(),
    handleValidation
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      
      const vehicle = mockVehicles.find(v => v.id === id);
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      
      const records = mockMaintenanceRecords.filter(r => r.vehicleId === id);
      
      return res.json({
        success: true,
        records
      });
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/vehicles/:id/maintenance - Add maintenance record
router.post('/:id/maintenance',
  [
    param('id').notEmpty(),
    body('type').notEmpty(),
    body('description').notEmpty(),
    body('date').isISO8601(),
    body('mileage').isInt({ min: 0 }),
    body('cost').isFloat({ min: 0 }),
    body('provider').notEmpty(),
    body('notes').optional().isString(),
    body('parts').optional().isArray(),
    handleValidation
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const maintenanceData = req.body;
      
      const vehicle = mockVehicles.find(v => v.id === id);
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      
      const newRecord = {
        id: `MAINT${String(mockMaintenanceRecords.length + 1).padStart(3, '0')}`,
        vehicleId: id,
        ...maintenanceData,
        status: 'completed'
      };
      
      mockMaintenanceRecords.push(newRecord);
      
      // Update vehicle's last maintenance date
      const vehicleIndex = mockVehicles.findIndex(v => v.id === id);
      if (vehicleIndex !== -1) {
        const updatedVehicle = { ...mockVehicles[vehicleIndex] };
        (updatedVehicle as any).lastMaintenance = maintenanceData.date;
        updatedVehicle.updatedAt = new Date().toISOString();
        mockVehicles[vehicleIndex] = updatedVehicle;
      }
      
      console.log('Added maintenance record:', newRecord);
      
      return res.status(201).json({
        success: true,
        record: newRecord,
        message: 'Maintenance record added successfully'
      });
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/vehicles/:id/tracking-history - Get tracking history for vehicle
router.get('/:id/tracking-history',
  [
    param('id').notEmpty(),
    query('start').isISO8601(),
    query('end').isISO8601(),
    handleValidation
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { start, end } = req.query;
      
      const vehicle = mockVehicles.find(v => v.id === id);
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      
      // Mock tracking history data
      const mockHistory = {
        deviceId: vehicle.gpsTracker || vehicle.gpsTrackerId || 'BW32001',
        startTime: new Date(start as string),
        endTime: new Date(end as string),
        points: [
          {
            deviceId: vehicle.gpsTracker || vehicle.gpsTrackerId || 'BW32001',
            vehicleId: id,
            timestamp: new Date(),
            latitude: 6.3005,
            longitude: -10.7969,
            speed: 45,
            heading: 180,
            altitude: 25,
            accuracy: 5,
            batteryLevel: 85,
            gsmSignal: 90,
            ignitionStatus: true,
            engineStatus: true,
            fuelLevel: vehicle.fuelLevel || 75,
            mileage: vehicle.mileage || 0,
            geoFenceStatus: 'inside' as const,
            alarms: []
          }
        ],
        totalDistance: 125.5,
        maxSpeed: 60,
        avgSpeed: 45,
        stoppedDuration: 30,
        movingDuration: 180
      };
      
      return res.json({
        success: true,
        history: mockHistory
      });
    } catch (error) {
      console.error('Error fetching tracking history:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
