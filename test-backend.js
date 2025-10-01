// Simple test to check if backend routes are working
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Test route for vehicles
app.get('/api/vehicles/:id', (req, res) => {
  const { id } = req.params;
  
  // Mock vehicle data that matches the frontend expectations
  const mockVehicles = {
    'VH001': {
      id: 'VH001',
      plateNumber: 'LBR-001-GOV',
      make: 'Toyota',
      model: 'Hilux',
      year: 2023,
      color: 'White',
      vinNumber: '1HGBH41JXMN109186',
      vehicleType: 'truck',
      status: 'active',
      department: 'Ministry of Health',
      departmentId: 'DEPT001',
      currentOperator: 'Dr. Sarah Johnson',
      operatorId: 'EMP001',
      gpsTracker: 'BW32001',
      fuelLevel: 75,
      mileage: 12500,
      lastLocation: 'Ministry of Health HQ',
      lastUpdate: new Date().toISOString(),
      lastMaintenance: '2024-01-01',
      nextMaintenance: '2024-04-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    'VH002': {
      id: 'VH002',
      plateNumber: 'LBR-002-GOV',
      make: 'Nissan',
      model: 'Patrol',
      year: 2022,
      color: 'Black',
      vinNumber: '2HGBH41JXMN109187',
      vehicleType: 'car',
      status: 'active',
      department: 'Ministry of Defense',
      departmentId: 'DEPT004',
      currentOperator: 'General Robert Smith',
      operatorId: 'EMP008',
      gpsTracker: 'BW32002',
      fuelLevel: 45,
      mileage: 28500,
      lastLocation: 'Defense Ministry HQ',
      lastUpdate: new Date().toISOString(),
      lastMaintenance: '2023-12-01',
      nextMaintenance: '2024-03-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
  
  const vehicle = mockVehicles[id];
  
  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }
  
  return res.json({
    success: true,
    vehicle
  });
});

// Test route for GPS devices
app.get('/api/hardware/bw32/devices', (req, res) => {
  const mockDevices = [
    {
      id: 'BW32001',
      imei: '863835030123456',
      simNumber: '+1234567890',
      batteryLevel: 95,
      signalStrength: 85,
      status: 'active',
      lastSeen: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
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
      lastSeen: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
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
      lastSeen: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      isAssigned: false,
      assignedVehicleId: null
    }
  ];
  
  return res.json({
    success: true,
    devices: mockDevices
  });
});

// Test route for vehicle maintenance
app.get('/api/vehicles/:id/maintenance', (req, res) => {
  const { id } = req.params;
  
  const mockRecords = [
    {
      id: 'MAINT001',
      vehicleId: id,
      type: 'Oil Change',
      description: 'Regular oil change and filter replacement',
      date: '2024-01-01',
      mileage: 12000,
      cost: 75.50,
      provider: 'GSA Motor Pool',
      status: 'completed',
      parts: ['Oil Filter', '5L Engine Oil'],
      notes: 'Routine maintenance completed successfully'
    }
  ];
  
  return res.json({
    success: true,
    records: mockRecords
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Test backend server running on port ${PORT}`);
  console.log(`Test with: curl http://localhost:${PORT}/api/vehicles/VH001`);
});
