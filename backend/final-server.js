// Simple server to test basic functionality
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock data for testing
const mockVehicles = [
  {
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
    currentOperator: 'Dr. Sarah Johnson',
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
    make: 'Nissan',
    model: 'Patrol',
    year: 2022,
    color: 'Black',
    vinNumber: '2HGBH41JXMN109187',
    vehicleType: 'car',
    status: 'active',
    department: 'Ministry of Defense',
    currentOperator: 'General Robert Smith',
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

const mockEquipment = [
  {
    id: 'EQ001',
    name: 'Dell Latitude 7420',
    brand: 'Dell',
    model: 'Latitude 7420',
    serialNumber: 'DL7420-001',
    type: 'laptop',
    category: 'equipment',
    department: 'Ministry of Health',
    assignedTo: 'Dr. Sarah Johnson',
    status: 'active',
    condition: 'excellent',
    location: 'Health Ministry - Room 201',
    purchaseDate: '2023-03-15',
    purchasePrice: 1200,
    warrantyExpiry: '2026-03-15',
    lastMaintenance: '2024-01-10',
    usefulLife: 4,
    salvageValue: 200,
    assignedEmployee: {
      id: 'EMP001',
      name: 'Dr. Sarah Johnson',
      badgeNumber: 'GSA-001'
    },
    facility: {
      id: 'FAC001',
      name: 'Ministry of Health HQ',
      room: 'Room 201'
    }
  },
  {
    id: 'EQ002',
    name: 'HP LaserJet Pro M404',
    brand: 'HP',
    model: 'LaserJet Pro M404',
    serialNumber: 'HP404-002',
    type: 'printer',
    category: 'equipment',
    department: 'General Services Agency',
    status: 'available',
    condition: 'good',
    location: 'GSA Central Office',
    purchaseDate: '2022-08-20',
    purchasePrice: 450,
    warrantyExpiry: '2024-08-20',
    lastMaintenance: '2024-01-05',
    usefulLife: 5,
    salvageValue: 50
  },
  {
    id: 'FU001',
    name: 'Executive Office Desk',
    brand: 'Steelcase',
    model: 'Series 9000',
    serialNumber: 'SC9000-001',
    type: 'desk',
    category: 'furniture',
    department: 'Ministry of Health',
    assignedTo: 'Dr. Sarah Johnson',
    status: 'active',
    condition: 'good',
    location: 'Health Ministry - Office 205',
    purchaseDate: '2022-01-15',
    purchasePrice: 850,
    usefulLife: 10,
    salvageValue: 100,
    notes: 'L-shaped executive desk with built-in cable management',
    assignedEmployee: {
      id: 'EMP001',
      name: 'Dr. Sarah Johnson',
      badgeNumber: 'GSA-001'
    },
    facility: {
      id: 'FAC001',
      name: 'Ministry of Health HQ',
      room: 'Office 205'
    }
  }
];

const mockFacilities = [
  {
    id: 'FAC001',
    name: 'Ministry of Health Headquarters',
    type: 'government_building',
    department: 'Ministry of Health',
    address: '123 Capitol Hill, Monrovia',
    status: 'operational',
    securityLevel: 'medium',
    contactPerson: 'Dr. Sarah Johnson',
    contactPhone: '+231-123-4567',
    contactEmail: 'contact@health.gov.lr',
    capacity: 500,
    location: [-10.7969, 6.3005],
    assignedVehicles: 2,
    assignedEquipment: 5,
    lastInspection: '2023-12-15',
    createdAt: new Date().toISOString()
  }
];

const mockEmployees = [
  {
    id: 'EMP001',
    name: 'Dr. Sarah Johnson',
    position: 'Health Administrator',
    department: 'Ministry of Health',
    badgeNumber: 'GSA-001',
    email: 'sarah.johnson@health.gov.lr',
    phone: '+231-123-4567',
    status: 'active',
    hireDate: '2020-01-15',
    clearanceLevel: 'high'
  }
];

// Routes
app.get('/api/vehicles', (req, res) => {
  res.json({ success: true, vehicles: mockVehicles, total: mockVehicles.length });
});

app.get('/api/vehicles/:id', (req, res) => {
  const vehicle = mockVehicles.find(v => v.id === req.params.id);
  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }
  res.json({ success: true, vehicle });
});

app.get('/api/equipment', (req, res) => {
  res.json({ success: true, equipment: mockEquipment, total: mockEquipment.length });
});

app.get('/api/equipment/:id', (req, res) => {
  const equipment = mockEquipment.find(eq => eq.id === req.params.id);
  if (!equipment) {
    return res.status(404).json({ error: 'Equipment not found' });
  }
  res.json({ success: true, equipment });
});

app.post('/api/equipment', (req, res) => {
  try {
    const equipmentData = req.body;
    
    // Generate new ID
    const newId = equipmentData.category === 'furniture' 
      ? `FU${String(mockEquipment.filter(eq => eq.category === 'furniture').length + 1).padStart(3, '0')}`
      : `EQ${String(mockEquipment.filter(eq => eq.category === 'equipment' || !eq.category).length + 1).padStart(3, '0')}`;
    
    const newEquipment = {
      id: newId,
      ...equipmentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to mock data
    mockEquipment.push(newEquipment);
    
    console.log('Created new equipment/furniture:', newEquipment);
    
    res.status(201).json({
      success: true,
      equipment: newEquipment,
      message: `${equipmentData.category === 'furniture' ? 'Furniture' : 'Equipment'} created successfully`
    });
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to create equipment' });
  }
});

app.get('/api/facilities', (req, res) => {
  res.json({ success: true, facilities: mockFacilities, total: mockFacilities.length });
});

app.get('/api/employees', (req, res) => {
  res.json({ success: true, employees: mockEmployees, total: mockEmployees.length });
});

app.get('/api/departments', (req, res) => {
  const departments = [
    { id: 'DEPT001', name: 'Ministry of Health', employeeCount: 150, vehicleCount: 5, equipmentCount: 25 },
    { id: 'DEPT002', name: 'Ministry of Defense', employeeCount: 200, vehicleCount: 10, equipmentCount: 15 },
    { id: 'DEPT003', name: 'IT Department', employeeCount: 25, vehicleCount: 2, equipmentCount: 50 }
  ];
  res.json({ success: true, departments, total: departments.length });
});

// Global search
app.get('/api/search/global', (req, res) => {
  const query = req.query.q?.toString().toLowerCase() || '';
  const results = [];

  // Search vehicles
  mockVehicles.forEach(vehicle => {
    if (vehicle.plateNumber.toLowerCase().includes(query) ||
        vehicle.make.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query) ||
        vehicle.department.toLowerCase().includes(query)) {
      results.push({
        id: vehicle.id,
        name: `${vehicle.make} ${vehicle.model}`,
        type: 'vehicle',
        category: 'Vehicle',
        department: vehicle.department,
        location: vehicle.lastLocation,
        status: vehicle.status,
        plateNumber: vehicle.plateNumber
      });
    }
  });

  // Search equipment
  mockEquipment.forEach(equipment => {
    if (equipment.name.toLowerCase().includes(query) ||
        equipment.brand.toLowerCase().includes(query) ||
        equipment.serialNumber.toLowerCase().includes(query) ||
        equipment.department.toLowerCase().includes(query)) {
      results.push({
        id: equipment.id,
        name: equipment.name,
        type: 'equipment',
        category: 'Equipment',
        department: equipment.department,
        location: equipment.location,
        status: equipment.status,
        serialNumber: equipment.serialNumber
      });
    }
  });

  // Search facilities
  mockFacilities.forEach(facility => {
    if (facility.name.toLowerCase().includes(query) ||
        facility.department.toLowerCase().includes(query) ||
        facility.address.toLowerCase().includes(query)) {
      results.push({
        id: facility.id,
        name: facility.name,
        type: 'facility',
        category: 'Facility',
        department: facility.department,
        location: facility.address,
        status: facility.status
      });
    }
  });

  res.json({ success: true, results, total: results.length });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// GPS devices for vehicle assignment
app.get('/api/hardware/bw32/devices', (req, res) => {
  const devices = [
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
  res.json({ success: true, devices });
});

// Vehicle maintenance
app.get('/api/vehicles/:id/maintenance', (req, res) => {
  const records = [
    {
      id: 'MAINT001',
      vehicleId: req.params.id,
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
  res.json({ success: true, records });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Simple backend server running on port ${PORT}`);
  console.log(`🔗 Test with: http://localhost:${PORT}/health`);
  console.log(`🚗 Vehicles: http://localhost:${PORT}/api/vehicles`);
  console.log(`💻 Equipment: http://localhost:${PORT}/api/equipment`);
  console.log(`🏢 Facilities: http://localhost:${PORT}/api/facilities`);
});
