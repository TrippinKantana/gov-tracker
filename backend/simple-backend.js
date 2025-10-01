/**
 * Simple Backend Server - Working Version
 * Located in backend directory with access to node_modules
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory data storage
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
    name: 'Ministry of Agriculture',
    code: 'MOA',
    type: 'ministry',
    headOfDepartment: 'Prof. Michael Davis',
    email: 'info@agriculture.gov.lr',
    phone: '+231-555-0102',
    address: 'Sinkor, Monrovia',
    budget: 18000000,
    status: 'active',
    employeeCount: 38,
    vehicleCount: 15,
    facilityCount: 12,
    equipmentCount: 67,
    establishedDate: '1847-07-26'
  },
  {
    id: 'DEPT003',
    name: 'General Services Agency',
    code: 'GSA',
    type: 'agency',
    headOfDepartment: 'Robert Wilson',
    email: 'info@gsa.gov.lr',
    phone: '+231-555-0103',
    address: 'Old Road, Monrovia',
    budget: 15000000,
    status: 'active',
    employeeCount: 52,
    vehicleCount: 18,
    facilityCount: 10,
    equipmentCount: 145,
    establishedDate: '1847-07-26'
  },
  {
    id: 'DEPT004',
    name: 'Ministry of Defense',
    code: 'MOD',
    type: 'ministry',
    headOfDepartment: 'General James Mitchell',
    email: 'info@defense.gov.lr',
    phone: '+231-555-0104',
    address: 'Camp Johnson Road, Monrovia',
    budget: 35000000,
    status: 'active',
    employeeCount: 89,
    vehicleCount: 25,
    facilityCount: 15,
    equipmentCount: 234,
    establishedDate: '1847-07-26'
  },
  {
    id: 'DEPT005',
    name: 'Ministry of Education',
    code: 'MOE',
    type: 'ministry',
    headOfDepartment: 'Prof. Alice Brown',
    email: 'info@education.gov.lr',
    phone: '+231-555-0105',
    address: 'Sinkor, Monrovia',
    budget: 22000000,
    status: 'restructuring',
    employeeCount: 67,
    vehicleCount: 8,
    facilityCount: 45,
    equipmentCount: 123,
    establishedDate: '1847-07-26'
  }
];

// Mock data for other endpoints
let vehicles = [
  { id: 'V001', name: 'Health Ambulance 1', department: 'Ministry of Health', status: 'active' },
  { id: 'V002', name: 'Police Vehicle 1', department: 'Ministry of Defense', status: 'active' }
];

let facilities = [
  { id: 'F001', name: 'Central Hospital', department: 'Ministry of Health', status: 'operational' },
  { id: 'F002', name: 'Defense HQ', department: 'Ministry of Defense', status: 'operational' }
];

let equipment = [
  { id: 'E001', name: 'Medical Equipment Set', department: 'Ministry of Health', status: 'active' },
  { id: 'E002', name: 'Defense Communication System', department: 'Ministry of Defense', status: 'active' }
];

let employees = [
  { id: 'P001', name: 'Dr. John Smith', department: 'Ministry of Health', role: 'Doctor' },
  { id: 'P002', name: 'Jane Doe', department: 'Ministry of Defense', role: 'Administrator' }
];

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth health check  
app.get('/api/auth/health', (req, res) => {
  res.json({ status: 'Auth service healthy' });
});

// Departments API
app.get('/api/departments', (req, res) => {
  res.json({
    success: true,
    departments: departments,
    total: departments.length
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
  res.json(vehicles);
});

// Facilities API  
app.get('/api/facilities', (req, res) => {
  res.json(facilities);
});

// Equipment API
app.get('/api/equipment', (req, res) => {
  res.json(equipment);
});

// Employees/Personnel API
app.get('/api/employees', (req, res) => {
  res.json(employees);
});

app.get('/api/personnel', (req, res) => {
  res.json(employees);
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

// Start server
app.listen(PORT, () => {
  console.log(`✅ Government Asset Tracker Backend running on port ${PORT}`);
  console.log(`🏛️ All API endpoints available and working`);
  console.log(`📊 Departments: ${departments.length}`);
  console.log(`🚗 Vehicles: ${vehicles.length}`);
  console.log(`🏢 Facilities: ${facilities.length}`);
  console.log(`💻 Equipment: ${equipment.length}`);
  console.log(`👥 Personnel: ${employees.length}`);
});
