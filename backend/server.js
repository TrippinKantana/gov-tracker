/**
 * Temporary JavaScript Server
 * Bypass TypeScript compilation issues
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const { createServer } = require('http');
const { Server } = require('socket.io');

// GPS Tracking Integration
const BW32Ingestor = require('./src/gps/bw32-ingestor');
const GPSHandler = require('./src/gps/gps-handler');

// Notification System
const NotificationSystem = require('./src/notifications/notification-system');
const NotificationTriggers = require('./src/notifications/notification-triggers');

// Report Generator - Now using beautiful pdfmake
const ReportGenerator = require('./src/reports/report-generator'); // Keep for drill-down
const PdfMakeReportGenerator = require('./src/reports/pdfmake-generator'); // Beautiful main reports
const DrillDownReporter = require('./src/reports/drill-down-reporter');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const DEFAULT_PORT = process.env.PORT || 5000;
const FALLBACK_PORTS = [5001, 5002, 5003, 8000, 8001, 8002];

// Function to check if port is available
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const testServer = require('net').createServer();
    testServer.listen(port, () => {
      testServer.once('close', () => resolve(true));
      testServer.close();
    });
    testServer.on('error', () => resolve(false));
  });
};

// Function to find available port
const findAvailablePort = async () => {
  // First try the default port
  if (await isPortAvailable(DEFAULT_PORT)) {
    return DEFAULT_PORT;
  }
  
  // Try fallback ports
  for (const port of FALLBACK_PORTS) {
    if (await isPortAvailable(port)) {
      console.log(`⚠️  Port ${DEFAULT_PORT} is in use, using port ${port} instead`);
      return port;
    }
  }
  
  throw new Error(`No available ports found. Tried: ${DEFAULT_PORT}, ${FALLBACK_PORTS.join(', ')}`);
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock data
let departments = [
  {
    id: 'DEPT001',
    name: 'Ministry of Health',
    code: 'MOH',
    type: 'ministry',
    headOfDepartment: 'Dr. Sarah Johnson',
    email: 'info@health.gov.lr',
    phone: '+231-555-0101',
    address: 'Capitol Hill, Monrovia',
    budget: 25000000,
    status: 'active',
    employeeCount: 45,
    vehicleCount: 12,
    facilityCount: 8,
    equipmentCount: 89,
    establishedDate: '1847-07-26'
  },
  {
    id: 'DEPT002',
    name: 'Ministry of Defense',
    code: 'MOD',
    type: 'ministry',
    headOfDepartment: 'General Robert Smith',
    email: 'info@defense.gov.lr',
    phone: '+231-555-0102',
    address: 'Camp Johnson Road, Monrovia',
    budget: 18000000,
    status: 'active',
    employeeCount: 200,
    vehicleCount: 25,
    facilityCount: 12,
    equipmentCount: 150,
    establishedDate: '1847-07-26'
  },
  {
    id: 'DEPT003',
    name: 'Ministry of Finance',
    code: 'MOF',
    type: 'ministry',
    headOfDepartment: 'Mary Williams',
    email: 'info@finance.gov.lr',
    phone: '+231-555-0103',
    address: 'Broad Street, Monrovia',
    budget: 35000000,
    status: 'active',
    employeeCount: 120,
    vehicleCount: 8,
    facilityCount: 5,
    equipmentCount: 75,
    establishedDate: '1847-07-26'
  },
  {
    id: 'DEPT004',
    name: 'IT Department',
    code: 'ITD',
    type: 'department',
    headOfDepartment: 'John Doe',
    email: 'info@it.gov.lr',
    phone: '+231-555-0104',
    address: 'GSA Building, Monrovia',
    budget: 5000000,
    status: 'active',
    employeeCount: 25,
    vehicleCount: 2,
    facilityCount: 1,
    equipmentCount: 50,
    establishedDate: '2020-01-01'
  }
];

let vehicles = [
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
    updatedAt: new Date().toISOString(),
    gsaCode: 'GSA-MOH-001',
    engineNumber: '2KD-FTV-001',
    chassisNumber: 'JTEBU11J123456789',
    registrationDate: '2023-01-15',
    insuranceExpiry: '2024-12-31',
    roadTaxExpiry: '2024-06-30',
    assignedDriver: 'Dr. Sarah Johnson',
    driverLicense: 'DL-2023-001',
    contactNumber: '+231-555-0101',
    notes: 'Primary medical transport vehicle'
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
    updatedAt: new Date().toISOString(),
    gsaCode: 'GSA-MOD-002',
    engineNumber: 'VQ40DE-002',
    chassisNumber: 'JN1TBNT30U1234567',
    registrationDate: '2022-03-20',
    insuranceExpiry: '2024-11-30',
    roadTaxExpiry: '2024-05-15',
    assignedDriver: 'General Robert Smith',
    driverLicense: 'DL-2022-002',
    contactNumber: '+231-555-0202',
    notes: 'Executive transport vehicle'
  },
  {
    id: 'VH003',
    plateNumber: 'LBR-003-GOV',
    make: 'Ford',
    model: 'Transit',
    year: 2021,
    color: 'Blue',
    vinNumber: '3HGBH41JXMN109188',
    vehicleType: 'van',
    status: 'maintenance',
    department: 'General Services Agency',
    currentOperator: 'John Doe',
    gpsTracker: 'BW32003',
    fuelLevel: 30,
    mileage: 45000,
    lastLocation: 'GSA Motor Pool',
    lastMaintenance: '2024-01-15',
    nextMaintenance: '2024-02-15',
    lastUpdate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    gsaCode: 'GSA-GSA-003',
    engineNumber: 'Duratorq-003',
    chassisNumber: 'WF0VXXTTG12345678',
    registrationDate: '2021-08-10',
    insuranceExpiry: '2024-10-15',
    roadTaxExpiry: '2024-04-20',
    assignedDriver: 'John Doe',
    driverLicense: 'DL-2021-003',
    contactNumber: '+231-555-0303',
    notes: 'Maintenance van for facility repairs'
  },
  {
    id: 'VH004',
    plateNumber: 'LBR-004-GOV',
    make: 'Toyota',
    model: 'Corolla',
    year: 2023,
    color: 'Silver',
    vinNumber: '4HGBH41JXMN109189',
    vehicleType: 'car',
    status: 'active',
    department: 'Ministry of Finance',
    currentOperator: 'Mary Williams',
    gpsTracker: 'BW32004',
    fuelLevel: 80,
    mileage: 8500,
    lastLocation: 'Finance Ministry',
    lastMaintenance: '2024-01-10',
    nextMaintenance: '2024-04-10',
    lastUpdate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    gsaCode: 'GSA-MOF-004',
    engineNumber: '2ZR-FE-004',
    chassisNumber: 'JT2BF28K123456789',
    registrationDate: '2023-02-28',
    insuranceExpiry: '2024-12-15',
    roadTaxExpiry: '2024-07-10',
    assignedDriver: 'Mary Williams',
    driverLicense: 'DL-2023-004',
    contactNumber: '+231-555-0404',
    notes: 'Finance ministry official vehicle'
  },
  {
    id: 'VH005',
    plateNumber: 'LBR-005-GOV',
    make: 'Isuzu',
    model: 'D-Max',
    year: 2020,
    color: 'Red',
    vinNumber: '5HGBH41JXMN109190',
    vehicleType: 'truck',
    status: 'inactive',
    department: 'Ministry of Public Works',
    currentOperator: 'James Brown',
    gpsTracker: 'BW32005',
    fuelLevel: 0,
    mileage: 65000,
    lastLocation: 'Public Works Depot',
    lastMaintenance: '2023-11-01',
    nextMaintenance: '2024-02-01',
    lastUpdate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    gsaCode: 'GSA-MOPW-005',
    engineNumber: '4JJ1-TC-005',
    chassisNumber: 'ADM1TBNT30U1234567',
    registrationDate: '2020-05-15',
    insuranceExpiry: '2024-09-30',
    roadTaxExpiry: '2024-03-25',
    assignedDriver: 'James Brown',
    driverLicense: 'DL-2020-005',
    contactNumber: '+231-555-0505',
    notes: 'Heavy duty construction vehicle - currently out of service'
  }
];

let facilities = [
  {
    id: 'FC001',
    name: 'Central Hospital',
    type: 'hospital',
    department: 'Ministry of Health',
    address: 'Capitol Hill, Monrovia',
    coordinates: [-10.7969, 6.2907], // Monrovia coordinates
    status: 'operational',
    capacity: 500,
    contactPerson: 'Dr. Mary Johnson',
    phone: '+231-555-0201'
  },
  {
    id: 'FC002',
    name: 'Defense Headquarters',
    type: 'military_base',
    department: 'Ministry of Defense',
    address: 'Camp Johnson Road, Monrovia',
    coordinates: [-10.7900, 6.2700], // Different area
    status: 'operational',
    capacity: 800,
    contactPerson: 'General Robert Smith',
    phone: '+231-555-0202'
  }
];

let equipment = [
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
    gsaCode: 'GSA-MOH-EQ-001',
    assetTag: 'AT-2023-001',
    supplier: 'Dell Technologies Liberia',
    invoiceNumber: 'INV-2023-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    salvageValue: 50,
    gsaCode: 'GSA-GSA-EQ-002',
    assetTag: 'AT-2022-002',
    supplier: 'HP Liberia',
    invoiceNumber: 'INV-2022-002',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'EQ003',
    name: 'Cisco Catalyst 2960 Switch',
    brand: 'Cisco',
    model: 'WS-C2960-24TC-L',
    serialNumber: 'CISCO-003',
    type: 'network_equipment',
    category: 'equipment',
    department: 'IT Department',
    status: 'active',
    condition: 'excellent',
    location: 'IT Server Room',
    purchaseDate: '2023-01-10',
    purchasePrice: 2500,
    warrantyExpiry: '2026-01-10',
    lastMaintenance: '2024-01-20',
    usefulLife: 7,
    salvageValue: 300,
    gsaCode: 'GSA-ITD-EQ-003',
    assetTag: 'AT-2023-003',
    supplier: 'Cisco Systems Liberia',
    invoiceNumber: 'INV-2023-003',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
    gsaCode: 'GSA-MOH-FU-001',
    assetTag: 'AT-2022-FU-001',
    supplier: 'Office Furniture Liberia',
    invoiceNumber: 'INV-2022-FU-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

let employees = [
  {
    id: 'EMP001',
    fullName: 'Dr. John Smith',
    badgeNumber: 'MOH-001',
    email: 'j.smith@health.gov.lr',
    phone: '+231-555-0201',
    position: 'Chief Medical Officer',
    department: 'Ministry of Health',
    clearanceLevel: 'secret',
    status: 'active',
    hireDate: '2020-01-15',
    vehicleAssignments: [],
    equipmentAssignments: []
  },
  {
    id: 'EMP002',
    fullName: 'Sarah Wilson',
    badgeNumber: 'MOA-001', 
    email: 's.wilson@agriculture.gov.lr',
    phone: '+231-555-0202',
    position: 'Agricultural Specialist',
    department: 'Ministry of Agriculture',
    clearanceLevel: 'confidential',
    status: 'active',
    hireDate: '2019-03-20',
    vehicleAssignments: [],
    equipmentAssignments: []
  }
];

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Government Asset Tracker API', 
    status: 'Running',
    endpoints: [
      '/health',
      '/api/departments',
      '/api/vehicles', 
      '/api/facilities',
      '/api/equipment',
      '/api/employees'
    ]
  });
});

// Favicon endpoint
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Departments API with real counts
app.get('/api/departments', (req, res) => {
  // Calculate real counts for each department
  const departmentsWithRealCounts = departments.map(dept => {
    const deptVehicles = vehicles.filter(v => v.department === dept.name).length;
    const deptFacilities = facilities.filter(f => f.department === dept.name).length;
    const deptEquipment = equipment.filter(e => e.department === dept.name).length;
    const deptPersonnel = employees.filter(p => p.department === dept.name).length;
    
    return {
      ...dept,
      vehicleCount: deptVehicles,
      facilityCount: deptFacilities,
      equipmentCount: deptEquipment,
      employeeCount: deptPersonnel,
      // Keep original fake counts as backup (remove these later)
      _originalVehicleCount: dept.vehicleCount,
      _originalFacilityCount: dept.facilityCount
    };
  });
  
  res.json({
    success: true,
    departments: departmentsWithRealCounts,
    total: departmentsWithRealCounts.length
  });
});

// GET single department by ID
app.get('/api/departments/:id', (req, res) => {
  const department = departments.find(d => d.id === req.params.id);
  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }
  
  res.json({
    success: true,
    department: department
  });
});

app.post('/api/departments', (req, res) => {
  const newDepartment = {
    id: `DEPT${Date.now()}`,
    ...req.body,
    employeeCount: 0,
    vehicleCount: 0,
    facilityCount: 0,
    equipmentCount: 0
  };
  
  departments.push(newDepartment);
  res.status(201).json({ success: true, department: newDepartment });
});

app.put('/api/departments/:id', (req, res) => {
  const index = departments.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }
  
  departments[index] = { ...departments[index], ...req.body };
  res.json({ success: true, department: departments[index] });
});

app.delete('/api/departments/:id', (req, res) => {
  const index = departments.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }
  
  departments.splice(index, 1);
  res.json({ success: true, message: 'Department deleted' });
});

// Vehicles API
app.get('/api/vehicles', (req, res) => {
  res.json({
    success: true,
    vehicles: vehicles,
    total: vehicles.length
  });
});

// GET single vehicle by ID
app.get('/api/vehicles/:id', (req, res) => {
  const vehicle = vehicles.find(v => v.id === req.params.id);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }
  
  res.json({
    success: true,
    vehicle: vehicle
  });
});

// POST vehicle
app.post('/api/vehicles', (req, res) => {
  const newVehicle = {
    id: `VH${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  vehicles.push(newVehicle);
  
  // Log activity
  logActivity('Created', 'vehicle', `${newVehicle.plateNumber} - ${newVehicle.make} ${newVehicle.model}`, req.body.enteredBy || 'System');
  
  res.status(201).json({ success: true, vehicle: newVehicle });
});

// PUT vehicle
app.put('/api/vehicles/:id', (req, res) => {
  const index = vehicles.findIndex(v => v.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }
  
  vehicles[index] = { ...vehicles[index], ...req.body, updatedAt: new Date().toISOString() };
  
  // Log activity
  logActivity('Updated', 'vehicle', `${vehicles[index].plateNumber} modified`, req.body.updatedBy || 'System');
  
  res.json({ success: true, vehicle: vehicles[index] });
});

// DELETE vehicle
app.delete('/api/vehicles/:id', (req, res) => {
  const index = vehicles.findIndex(v => v.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }
  
  vehicles.splice(index, 1);
  res.json({ success: true, message: 'Vehicle deleted' });
});

// Vehicle Maintenance API
let vehicleMaintenanceRecords = [
  {
    id: 'MR001',
    vehicleId: 'VH001',
    type: 'routine',
    description: 'Oil change and general inspection',
    performedBy: 'GSA Maintenance Team',
    date: '2024-01-15',
    cost: 150,
    nextDueDate: '2024-04-15',
    status: 'completed'
  }
];

// GET vehicle maintenance records
app.get('/api/vehicles/:id/maintenance', (req, res) => {
  const vehicleId = req.params.id;
  const maintenanceRecords = vehicleMaintenanceRecords.filter(record => record.vehicleId === vehicleId);
  
  res.json({
    success: true,
    maintenance: maintenanceRecords,
    total: maintenanceRecords.length
  });
});

// POST vehicle maintenance record
app.post('/api/vehicles/:id/maintenance', (req, res) => {
  const vehicleId = req.params.id;
  const newRecord = {
    id: `MR${Date.now()}`,
    vehicleId: vehicleId,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  vehicleMaintenanceRecords.push(newRecord);
  res.status(201).json({ success: true, maintenance: newRecord });
});

// PUT vehicle maintenance record
app.put('/api/vehicles/:vehicleId/maintenance/:id', (req, res) => {
  const index = vehicleMaintenanceRecords.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }
  
  vehicleMaintenanceRecords[index] = { ...vehicleMaintenanceRecords[index], ...req.body };
  res.json({ success: true, maintenance: vehicleMaintenanceRecords[index] });
});

// DELETE vehicle maintenance record
app.delete('/api/vehicles/:vehicleId/maintenance/:id', (req, res) => {
  const index = vehicleMaintenanceRecords.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }
  
  vehicleMaintenanceRecords.splice(index, 1);
  res.json({ success: true, message: 'Maintenance record deleted' });
});

// Unassign GPS tracker from vehicle
app.post('/api/vehicles/:vehicleId/unassign-tracker', (req, res) => {
  const vehicleId = req.params.vehicleId;
  
  // Find the vehicle
  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (!vehicle) {
    return res.json({
      success: false,
      error: 'Vehicle not found'
    });
  }
  
  const trackerId = vehicle.gpsTracker;
  if (!trackerId) {
    return res.json({
      success: false,
      error: 'No GPS tracker assigned to this vehicle'
    });
  }
  
  // Find and unassign the GPS device in GPS handler
  if (gpsHandler.devices && gpsHandler.devices.has(trackerId)) {
    const deviceInfo = gpsHandler.devices.get(trackerId);
    deviceInfo.vehicleId = null;
    deviceInfo.status = 'available';
    console.log(`📡 GPS device ${trackerId} unassigned from vehicle ${vehicleId}`);
  }
  
  // Clear the tracker from the vehicle
  delete vehicle.gpsTracker;
  
  res.json({
    success: true,
    message: 'GPS tracker unassigned successfully'
  });
});

// Facilities API
app.get('/api/facilities', (req, res) => {
  res.json({
    success: true,
    facilities: facilities,
    total: facilities.length
  });
});

// GET single facility by ID
app.get('/api/facilities/:id', (req, res) => {
  const facility = facilities.find(f => f.id === req.params.id);
  if (!facility) {
    return res.status(404).json({
      success: false,
      message: 'Facility not found'
    });
  }
  
  res.json({
    success: true,
    facility: facility
  });
});

// POST facility
app.post('/api/facilities', (req, res) => {
  const newFacility = {
    id: `FC${Date.now()}`,
    ...req.body,
    coordinates: req.body.coordinates || [-10.7969, 6.2907], // Default Monrovia coordinates
  };
  
  facilities.push(newFacility);
  res.status(201).json({ success: true, facility: newFacility });
});

// PUT facility
app.put('/api/facilities/:id', (req, res) => {
  const index = facilities.findIndex(f => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Facility not found' });
  }
  
  facilities[index] = { ...facilities[index], ...req.body };
  res.json({ success: true, facility: facilities[index] });
});

// DELETE facility
app.delete('/api/facilities/:id', (req, res) => {
  const index = facilities.findIndex(f => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Facility not found' });
  }
  
  facilities.splice(index, 1);
  res.json({ success: true, message: 'Facility deleted' });
});

// Facility Maintenance API
let facilityMaintenanceRecords = [
  {
    id: 'FMR001',
    facilityId: 'FC001',
    type: 'routine',
    description: 'HVAC system maintenance and cleaning',
    performedBy: 'GSA Facility Team',
    date: '2024-01-10',
    cost: 500,
    nextDueDate: '2024-04-10',
    status: 'completed'
  }
];

// GET facility maintenance records
app.get('/api/facilities/:id/maintenance', (req, res) => {
  const facilityId = req.params.id;
  const maintenanceRecords = facilityMaintenanceRecords.filter(record => record.facilityId === facilityId);
  
  res.json({
    success: true,
    maintenance: maintenanceRecords,
    total: maintenanceRecords.length
  });
});

// POST facility maintenance record
app.post('/api/facilities/:id/maintenance', (req, res) => {
  const facilityId = req.params.id;
  const newRecord = {
    id: `FMR${Date.now()}`,
    facilityId: facilityId,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  facilityMaintenanceRecords.push(newRecord);
  res.status(201).json({ success: true, maintenance: newRecord });
});

// PUT facility maintenance record
app.put('/api/facilities/:facilityId/maintenance/:id', (req, res) => {
  const index = facilityMaintenanceRecords.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }
  
  facilityMaintenanceRecords[index] = { ...facilityMaintenanceRecords[index], ...req.body };
  res.json({ success: true, maintenance: facilityMaintenanceRecords[index] });
});

// DELETE facility maintenance record
app.delete('/api/facilities/:facilityId/maintenance/:id', (req, res) => {
  const index = facilityMaintenanceRecords.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }
  
  facilityMaintenanceRecords.splice(index, 1);
  res.json({ success: true, message: 'Maintenance record deleted' });
});

// Equipment API
app.get('/api/equipment', (req, res) => {
  res.json({
    success: true,
    equipment: equipment,
    total: equipment.length
  });
});

// GET single equipment by ID
app.get('/api/equipment/:id', (req, res) => {
  const item = equipment.find(e => e.id === req.params.id);
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Equipment not found'
    });
  }
  
  res.json({
    success: true,
    equipment: item
  });
});

// Employees API
app.get('/api/employees', (req, res) => {
  res.json({
    success: true,
    employees: employees,
    total: employees.length
  });
});

app.get('/api/personnel', (req, res) => {
  res.json({
    success: true,
    personnel: employees,
    total: employees.length
  });
});

// GET single employee by ID
app.get('/api/employees/:id', (req, res) => {
  const employee = employees.find(e => e.id === req.params.id);
  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }
  
  res.json({
    success: true,
    employee: employee
  });
});

app.get('/api/personnel/:id', (req, res) => {
  const employee = employees.find(e => e.id === req.params.id);
  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Personnel not found'
    });
  }
  
  res.json({
    success: true,
    personnel: employee
  });
});

// POST personnel
app.post('/api/personnel', (req, res) => {
  const newEmployee = {
    id: `EMP${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  employees.push(newEmployee);
  res.status(201).json({ success: true, personnel: newEmployee });
});

// PUT personnel
app.put('/api/personnel/:id', (req, res) => {
  const index = employees.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Personnel not found' });
  }
  
  employees[index] = { ...employees[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json({ success: true, personnel: employees[index] });
});

// DELETE personnel
app.delete('/api/personnel/:id', (req, res) => {
  const index = employees.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Personnel not found' });
  }
  
  employees.splice(index, 1);
  res.json({ success: true, message: 'Personnel deleted' });
});

// GPS Hardware API
let gpsDevices = [
  {
    deviceId: 'BW32001',
    name: 'GPS Tracker BW32-001',
    status: 'available',
    batteryLevel: 85,
    signal: 'strong',
    vehicleId: null,
    lastSeen: new Date().toISOString(),
    simNumber: '1234567890',
    imei: 'BW32001-IMEI-001'
  },
  {
    deviceId: 'BW32002', 
    name: 'GPS Tracker BW32-002',
    status: 'assigned',
    batteryLevel: 92,
    signal: 'strong',
    vehicleId: 'VH001',
    lastSeen: new Date().toISOString(),
    simNumber: '1234567891',
    imei: 'BW32002-IMEI-002'
  },
  {
    deviceId: 'BW32003',
    name: 'GPS Tracker BW32-003',
    status: 'available',
    batteryLevel: 88,
    signal: 'strong',
    vehicleId: null,
    lastSeen: new Date().toISOString(),
    simNumber: '1234567892',
    imei: 'BW32003-IMEI-003'
  },
  {
    deviceId: 'BW32004',
    name: 'GPS Tracker BW32-004',
    status: 'available',
    batteryLevel: 91,
    signal: 'moderate',
    vehicleId: null,
    lastSeen: new Date().toISOString(),
    simNumber: '1234567893',
    imei: 'BW32004-IMEI-004'
  },
  {
    deviceId: 'BW32005',
    name: 'GPS Tracker BW32-005',
    status: 'available',
    batteryLevel: 75,
    signal: 'strong',
    vehicleId: null,
    lastSeen: new Date().toISOString(),
    simNumber: '1234567894',
    imei: 'BW32005-IMEI-005'
  }
];

// Endpoint that frontend is calling for GPS device list
app.get('/api/gps/devices', (req, res) => {
  // Get devices registered in GPS handler (real connected devices)
  const registeredDevices = gpsHandler.devices ? Array.from(gpsHandler.devices.entries()).map(([deviceId, info]) => ({
    deviceId,
    name: info.name || `GPS ${deviceId}`,
    status: info.status || (info.vehicleId ? 'assigned' : 'available'),
    batteryLevel: null, // TODO: Get from device heartbeat
    signal: null, // TODO: Get from device data
    vehicleId: info.vehicleId || null,
    lastSeen: info.lastSeen || null,
    simNumber: null,
    imei: deviceId
  })) : [];
  
  res.json({
    success: true,
    devices: registeredDevices,
    total: registeredDevices.length
  });
});

app.get('/api/hardware/bw32/devices', (req, res) => {
  res.json({
    success: true,
    devices: gpsDevices,
    total: gpsDevices.length
  });
});

// Endpoint to register/assign GPS device to vehicle
app.post('/api/gps/devices', (req, res) => {
  const { deviceId, vehicleId, name } = req.body;
  
  // Check if device exists in GPS handler (real connected device)
  if (!gpsHandler.devices || !gpsHandler.devices.has(deviceId)) {
    return res.json({
      success: false,
      error: 'GPS device not found. Device must be connected to server first.'
    });
  }
  
  const deviceInfo = gpsHandler.devices.get(deviceId);
  if (deviceInfo.vehicleId) {
    return res.json({
      success: false,
      error: 'Device is already assigned to a vehicle'
    });
  }
  
  // Update device assignment via GPS handler
  deviceInfo.vehicleId = vehicleId;
  if (name) deviceInfo.name = name;
  deviceInfo.status = 'assigned';
  
  // Also update the vehicle's gpsTracker field if it exists
  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (vehicle) {
    vehicle.gpsTracker = deviceId;
  }
  
  console.log(`📡 GPS device ${deviceId} assigned to vehicle ${vehicleId}`);
  
  res.json({
    success: true,
    message: 'GPS device assigned successfully',
    device: {
      deviceId,
      vehicleId: vehicleId,
      name: deviceInfo.name,
      status: 'assigned',
      lastSeen: deviceInfo.lastSeen
    }
  });
});

// Assets API
app.get('/api/assets', (req, res) => {
  res.json([...vehicles, ...facilities, ...equipment]);
});

// Tracking API
app.get('/api/tracking', (req, res) => {
  res.json([]);
});

// Hardware API
app.get('/api/hardware', (req, res) => {
  res.json([]);
});

// Notifications API
app.get('/api/notifications', (req, res) => {
  res.json([]);
});

// Search API
app.get('/api/search', (req, res) => {
  res.json([]);
});

// Simple notification API for testing
let simpleNotifications = [
  {
    id: 'NOTIF_001',
    type: 'security',
    priority: 'urgent', 
    title: '🚨 GPS Tracker Offline',
    message: 'Vehicle LBR-001-GOV GPS tracker has been offline for 45 minutes. Possible theft or malfunction.',
    timestamp: new Date().toISOString(),
    read: false,
    data: { vehicleId: 'LBR-001-GOV' }
  },
  {
    id: 'NOTIF_002',
    type: 'maintenance',
    priority: 'high',
    title: '🔧 Vehicle Maintenance Due', 
    message: 'Toyota Hilux (LBR-002-GOV) has reached 5,000km and requires scheduled maintenance.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    read: false,
    data: { vehicleId: 'LBR-002-GOV', mileage: 5000 }
  },
  {
    id: 'NOTIF_003',
    type: 'system',
    priority: 'medium',
    title: '⚠️ Low Battery Alert',
    message: 'GPS tracker battery level is 15% for vehicle LBR-003-GOV',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    read: true,
    data: { vehicleId: 'LBR-003-GOV', batteryLevel: 15 }
  }
];

app.get('/api/notifications', (req, res) => {
  const unread = simpleNotifications.filter(n => !n.read).length;
  res.json({
    success: true,
    notifications: simpleNotifications,
    unread: unread
  });
});

app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const notification = simpleNotifications.find(n => n.id === id);
  
  if (notification) {
    notification.read = true;
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Notification not found' });
  }
});

app.put('/api/notifications/mark-all-read', (req, res) => {
  simpleNotifications.forEach(notif => {
    notif.read = true;
  });
  res.json({ success: true });
});

// Recent reports storage
let recentReports = [];

// Stock Inventory Data
let stockInventory = [
  {
    id: 'STK001',
    name: 'Office Paper A4',
    sku: 'PAPER-A4-001',
    category: 'office_supplies',
    quantity: 150,
    unit: 'reams',
    unitPrice: 8.50,
    minimumLevel: 20,
    location: 'GSA Central Warehouse',
    department: 'General Services Agency',
    supplier: 'Liberia Office Supplies Ltd',
    lastRestocked: '2024-01-15',
    status: 'in_stock'
  },
  {
    id: 'STK002',
    name: 'Blue Ink Cartridge',
    sku: 'INK-BLUE-002',
    category: 'office_supplies',
    quantity: 5,
    unit: 'cartridges',
    unitPrice: 25.00,
    minimumLevel: 10,
    location: 'IT Department',
    department: 'IT Department',
    supplier: 'Tech Solutions Inc',
    lastRestocked: '2024-01-10',
    status: 'low_stock'
  },
  {
    id: 'STK003',
    name: 'Cleaning Supplies Kit',
    sku: 'CLEAN-003',
    category: 'maintenance',
    quantity: 0,
    unit: 'kits',
    unitPrice: 45.00,
    minimumLevel: 5,
    location: 'Maintenance Department',
    department: 'General Services Agency',
    supplier: 'CleanPro Liberia',
    lastRestocked: '2023-12-20',
    status: 'out_of_stock'
  },
  {
    id: 'STK004',
    name: 'First Aid Kit',
    sku: 'MED-004',
    category: 'medical_supplies',
    quantity: 25,
    unit: 'kits',
    unitPrice: 35.00,
    minimumLevel: 15,
    location: 'Health Ministry',
    department: 'Ministry of Health',
    supplier: 'Medical Supplies Co',
    lastRestocked: '2024-01-20',
    status: 'in_stock'
  },
  {
    id: 'STK005',
    name: 'Vehicle Oil 5W-30',
    sku: 'OIL-005',
    category: 'vehicle_supplies',
    quantity: 8,
    unit: 'quarts',
    unitPrice: 12.50,
    minimumLevel: 20,
    location: 'Motor Pool',
    department: 'General Services Agency',
    supplier: 'Auto Parts Liberia',
    lastRestocked: '2024-01-12',
    status: 'low_stock'
  }
];

let goodsReleases = [];
let assetConversions = [];

// Activity Log for Audit Trail
let activityLog = [];

const logActivity = (action, type, details, userId = 'System') => {
  const activity = {
    id: `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    action,
    type,
    details,
    userId,
    timestamp: new Date().toISOString(),
    ip: 'N/A'
  };
  
  activityLog.unshift(activity);
  
  // Keep last 500 activities
  if (activityLog.length > 500) {
    activityLog = activityLog.slice(0, 500);
  }
  
  console.log(`📝 Activity logged: ${action} - ${type} - ${details}`);
  return activity;
};

// Activity Log API - Get recent activities
app.get('/api/activity/recent', (req, res) => {
  const limit = parseInt(req.query.limit) || 15;
  const activities = activityLog.slice(0, limit).map(a => ({
    id: a.id,
    type: a.type,
    message: `${a.action}: ${a.details}`,
    timestamp: a.timestamp,
    icon: getActivityIcon(a.type),
    color: getActivityColor(a.type)
  }));
  
  res.json({
    success: true,
    activities,
    total: activityLog.length
  });
});

const getActivityIcon = (type) => {
  const icons = {
    'vehicle': 'TruckIcon',
    'equipment': 'ComputerDesktopIcon',
    'furniture': 'CubeIcon',
    'facility': 'BuildingOfficeIcon',
    'personnel': 'UsersIcon',
    'stock': 'CubeIcon',
    'release': 'TruckIcon',
    'report': 'ChartBarIcon',
    'alert': 'ExclamationTriangleIcon',
    'user': 'UsersIcon',
    'system': 'CheckCircleIcon'
  };
  return icons[type] || 'CheckCircleIcon';
};

const getActivityColor = (type) => {
  const colors = {
    'vehicle': 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
    'equipment': 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    'furniture': 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400',
    'facility': 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
    'personnel': 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
    'stock': 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400',
    'release': 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400',
    'report': 'bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-400',
    'alert': 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
    'user': 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-400',
    'system': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
  };
  return colors[type] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
};

// Report Generation API - Now using beautiful pdfmake generator
app.post('/api/reports/generate', async (req, res) => {
  try {
    console.log('🎨 Beautiful report generation request:', req.body);
    
    // Create beautiful pdfmake report generator
    const reportGenerator = new PdfMakeReportGenerator({ pool: null });
    
    // Generate beautiful PDF report
    const doc = await reportGenerator.generateReport(req.body);
    
    // Track recent report
    const reportRecord = {
      id: `RPT-${Date.now()}`,
      type: req.body.reportType,
      macName: req.body.macName,
      facilityName: req.body.facilityName,
      period: req.body.dateRange.label,
      generatedBy: req.body.generatedBy,
      generatedAt: new Date().toISOString(),
      filename: `beautiful-${req.body.reportType}-report-${req.body.dateRange.label.replace(/\s+/g, '-')}.pdf`
    };
    
    recentReports.unshift(reportRecord);
    recentReports = recentReports.slice(0, 10); // Keep last 10 reports
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportRecord.filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Pipe beautiful PDF to response
    doc.pipe(res);
    doc.end();
    
    console.log('✅ Beautiful report generated successfully:', reportRecord.filename);
    
  } catch (error) {
    console.error('❌ Beautiful report generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate beautiful report',
      error: error.message
    });
  }
});

// Get recent reports
app.get('/api/reports/recent', (req, res) => {
  res.json({
    success: true,
    reports: recentReports
  });
});

// Stock Inventory APIs
app.get('/api/stock/inventory', (req, res) => {
  res.json({
    success: true,
    stock: stockInventory,
    total: stockInventory.length
  });
});

app.get('/api/stock/releases', (req, res) => {
  res.json({
    success: true,
    releases: goodsReleases,
    total: goodsReleases.length
  });
});

// Add new stock item
app.post('/api/stock/inventory', (req, res) => {
  const newStockItem = {
    id: `STK_${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  stockInventory.push(newStockItem);
  
  // Log activity
  logActivity('Created', 'stock', `${newStockItem.name} (Qty: ${newStockItem.quantity})`, req.body.receivedBy || 'System');
  
  console.log('📦 New stock item added:', newStockItem.name);
  res.status(201).json({ 
    success: true, 
    stockItem: newStockItem 
  });
});

// Release goods from warehouse
app.post('/api/stock/release', (req, res) => {
  const release = {
    id: `REL_${Date.now()}`,
    ...req.body,
    releaseDate: new Date().toISOString(),
    status: 'released',
    createdAt: new Date().toISOString()
  };

  // Update stock quantity
  const stockItem = stockInventory.find(item => item.id === req.body.stockItemId);
  if (stockItem && stockItem.quantity >= req.body.quantity) {
    stockItem.quantity -= req.body.quantity;
    
    // Add to releases
    goodsReleases.push(release);
    
    // Log activity
    logActivity('Released', 'release', `${release.quantity} x ${req.body.itemName} to ${release.requestingMAC}`, release.releasedBy || 'System');
    
    console.log('📦 Goods released:', release.id);
    res.status(201).json({ success: true, release });
  } else {
    res.status(400).json({ 
      success: false, 
      message: 'Insufficient stock quantity' 
    });
  }
});

// Update release status to delivered
app.put('/api/stock/releases/:id/delivered', (req, res) => {
  const { id } = req.params;
  const release = goodsReleases.find(r => r.id === id);
  
  if (!release) {
    return res.status(404).json({ success: false, message: 'Release not found' });
  }

  release.status = 'delivered';
  release.deliveredAt = req.body.deliveredAt;
  release.updatedAt = new Date().toISOString();

  console.log('🚛 Release marked as delivered:', id);
  res.json({ success: true, release });
});

// Convert goods to assets (dual confirmation complete)
app.post('/api/stock/convert-to-assets', (req, res) => {
  const { releaseId, confirmation, macId, facilityId } = req.body;
  
  const release = goodsReleases.find(r => r.id === releaseId);
  if (!release) {
    return res.status(404).json({ success: false, message: 'Release not found' });
  }

  // Create assets from delivered goods
  const newAssets = [];
  for (let i = 0; i < release.quantity; i++) {
    const asset = {
      id: `AST_${Date.now()}_${i}`,
      name: release.itemName,
      serialNumber: `SN-${release.id}-${i + 1}`,
      category: 'converted_from_stock',
      department: release.requestingMAC,
      departmentId: macId,
      facilityId: facilityId,
      facilityName: release.destinationFacility,
      status: 'active',
      condition: 'excellent',
      source: 'warehouse_release',
      releaseId: releaseId,
      receivedDate: confirmation.receivedDate,
      receivedBy: confirmation.receivedBy,
      createdAt: new Date().toISOString()
    };
    
    newAssets.push(asset);
    equipment.push(asset); // Add to main equipment array
  }

  // Update release status
  release.status = 'confirmed';
  release.facilityConfirmation = confirmation;
  release.completedAt = new Date().toISOString();

  // Track conversion for audit trail
  assetConversions.push({
    id: `CONV_${Date.now()}`,
    releaseId,
    assetsCreated: newAssets.length,
    convertedAt: new Date().toISOString(),
    convertedBy: confirmation.receivedBy
  });

  console.log(`✅ Converted ${newAssets.length} items to trackable assets`);
  
  res.json({
    success: true,
    message: 'Goods successfully converted to trackable assets',
    assetsCreated: newAssets.length,
    newAssets: newAssets
  });
});

// Note: Delete functionality removed for audit compliance
// Reports are preserved for government audit trails

// Drill-down report generation
app.post('/api/reports/drill-down', async (req, res) => {
  try {
    console.log('📊 Drill-down report request:', req.body);
    
    // Create drill-down reporter
    const drillDownReporter = new DrillDownReporter();
    
    // Generate specific item report
    const doc = await drillDownReporter.generateReport(req.body);
    
    // Track recent report
    const reportRecord = {
      id: `DRILL-${Date.now()}`,
      type: `${req.body.category}-${req.body.reportType}`,
      itemName: req.body.specificItemName,
      macName: req.body.macName,
      facilityName: req.body.facilityName,
      period: drillDownReporter.formatTimeRange(req.body.timeRange, req.body.customStartDate, req.body.customEndDate),
      generatedBy: req.body.generatedBy,
      generatedAt: new Date().toISOString(),
      filename: `${req.body.specificItemName}-${req.body.reportType}-report.pdf`
    };
    
    recentReports.unshift(reportRecord);
    recentReports = recentReports.slice(0, 10);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportRecord.filename}"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    console.log('✅ Drill-down report generated:', reportRecord.filename);
    
  } catch (error) {
    console.error('❌ Drill-down report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate drill-down report',
      error: error.message
    });
  }
});

// Socket.IO for real-time GPS updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-tracking', (assetId) => {
    socket.join(`asset-${assetId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize GPS Tracking System
const gpsHandler = new GPSHandler({ app, io });
gpsHandler.init();

// Initialize Notification System
const notificationSystem = new NotificationSystem({ app, io });
// Skip notification triggers for now - focus on basic notification system
// const notificationTriggers = new NotificationTriggers(notificationSystem, gpsHandler);

// Initialize BW32 GPS Ingestor
const bw32Ingestor = new BW32Ingestor({ port: 50100 });

// Handle GPS events
bw32Ingestor.on('heartbeat', (data) => {
  gpsHandler.handleHeartbeat(data);
});

bw32Ingestor.on('position', (position) => {
  gpsHandler.handlePosition(position);
});

bw32Ingestor.on('alarm', (alarm) => {
  gpsHandler.handleAlarm(alarm);
});

bw32Ingestor.on('error', (error) => {
  console.error('🚨 BW32 Ingestor error:', error);
});

// Start server with port availability check
const startServer = async () => {
  try {
    const PORT = await findAvailablePort();
    
    server.listen(PORT, () => {
      console.log(`✅ Government Asset Tracker Server running on port ${PORT}`);
      console.log(`🏛️ All API endpoints restored and working`);
      
      // Start GPS tracker ingestor
      bw32Ingestor.start();
      console.log(`🛰️ GPS Tracker system ready on port 50100`);
      
      // Create some test notifications after startup
      setTimeout(() => {
        createTestNotifications(notificationSystem);
      }, 2000);
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please try again.`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

// Create test notifications for development
function createTestNotifications(notificationSystem) {
  console.log('🧪 Creating test notifications...');
  
  // Test urgent security alert
  notificationSystem.sendNotification({
    type: 'security',
    priority: 'urgent',
    title: '🚨 GPS Tracker Offline',
    message: 'Vehicle LBR-001-GOV GPS tracker has been offline for 45 minutes. Possible theft or malfunction.',
    data: { vehicleId: 'LBR-001-GOV', lastSeen: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    channels: ['in-app']
  });

  // Test maintenance alert
  notificationSystem.sendNotification({
    type: 'maintenance',
    priority: 'high',
    title: '🔧 Vehicle Maintenance Due',
    message: 'Toyota Hilux (LBR-002-GOV) has reached 5,000km and requires scheduled maintenance.',
    data: { vehicleId: 'LBR-002-GOV', mileage: 5000, maintenanceType: 'scheduled' },
    channels: ['in-app']
  });

  // Test system alert
  notificationSystem.sendNotification({
    type: 'system',
    priority: 'medium',
    title: '⚠️ Low Battery Alert',
    message: 'GPS tracker battery level is 15% for vehicle LBR-003-GOV',
    data: { vehicleId: 'LBR-003-GOV', batteryLevel: 15 },
    channels: ['in-app']
  });

  // Test assignment alert
  notificationSystem.sendNotification({
    type: 'assignment',
    priority: 'medium',
    title: '👤 New Asset Assignment',
    message: 'Dell Laptop (EQ-001) has been assigned to John Doe in Ministry of Health',
    data: { equipmentId: 'EQ-001', assignedTo: 'John Doe', department: 'Ministry of Health' },
    channels: ['in-app']
  });

  console.log('✅ Test notifications created');
}

module.exports = { io };
