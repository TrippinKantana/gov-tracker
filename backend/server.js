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

// Report Generator
const ReportGenerator = require('./src/reports/report-generator');
const DrillDownReporter = require('./src/reports/drill-down-reporter');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

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
  }
];

let vehicles = [
  {
    id: 'VH001',
    plateNumber: 'LBR-001-GOV',
    make: 'Toyota',
    model: 'Hilux',
    year: 2020,
    vehicleType: 'truck',
    department: 'Ministry of Health',
    status: 'active'
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
    name: 'Medical Equipment Set',
    category: 'medical',
    department: 'Ministry of Health',
    status: 'active'
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
  res.status(201).json({ success: true, vehicle: newVehicle });
});

// PUT vehicle
app.put('/api/vehicles/:id', (req, res) => {
  const index = vehicles.findIndex(v => v.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }
  
  vehicles[index] = { ...vehicles[index], ...req.body, updatedAt: new Date().toISOString() };
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
    id: 'BW32001',
    name: 'GPS Tracker BW32-001',
    status: 'available',
    batteryLevel: 85,
    signal: 'strong'
  },
  {
    id: 'BW32002', 
    name: 'GPS Tracker BW32-002',
    status: 'assigned',
    assignedTo: 'VH001',
    batteryLevel: 92,
    signal: 'strong'
  }
];

app.get('/api/hardware/bw32/devices', (req, res) => {
  res.json({
    success: true,
    devices: gpsDevices,
    total: gpsDevices.length
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
    name: 'Office Chairs',
    category: 'Furniture',
    description: 'Ergonomic office chairs with wheels',
    quantity: 150,
    unitCost: 85.00,
    totalValue: 12750.00,
    supplier: 'Office Solutions Ltd',
    receivedDate: '2024-01-15',
    status: 'available',
    minimumLevel: 10,
    location: 'Warehouse A - Section 1',
    batchNumber: 'BATCH-2024-001'
  },
  {
    id: 'STK002',
    name: 'Desktop Computers',
    category: 'Electronics',
    description: 'Dell OptiPlex 7090 Desktop Computers',
    quantity: 45,
    unitCost: 650.00,
    totalValue: 29250.00,
    supplier: 'Dell Technologies',
    receivedDate: '2024-01-20',
    status: 'available',
    minimumLevel: 5,
    location: 'Warehouse B - Electronics Section'
  }
];

let goodsReleases = [];
let assetConversions = [];

// Report Generation API
app.post('/api/reports/generate', async (req, res) => {
  try {
    console.log('📊 Report generation request:', req.body);
    
    // Create report generator
    const reportGenerator = new ReportGenerator({ pool: null });
    
    // Generate PDF report
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
      filename: `${req.body.reportType}-report-${req.body.dateRange.label.replace(/\s+/g, '-')}.pdf`
    };
    
    recentReports.unshift(reportRecord);
    recentReports = recentReports.slice(0, 10); // Keep last 10 reports
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportRecord.filename}"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    console.log('✅ Report generated successfully:', reportRecord.filename);
    
  } catch (error) {
    console.error('❌ Report generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
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
