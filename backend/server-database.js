/**
 * Database-Enabled Server
 * Replaces mock data with PostgreSQL queries
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const { createServer } = require('http');
const { Server } = require('socket.io');

// Database Connection
const { query, initDatabase } = require('./src/config/database');

// GPS Tracking Integration
const BW32Ingestor = require('./src/gps/bw32-ingestor');
const GPSHandler = require('./src/gps/gps-handler');

// Notification System
const NotificationSystem = require('./src/notifications/notification-system');

// Report Generator
const ReportGenerator = require('./src/reports/report-generator');
const PdfMakeReportGenerator = require('./src/reports/pdfmake-generator');
const DrillDownReporter = require('./src/reports/drill-down-reporter');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://35.241.151.113",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const DEFAULT_PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://35.241.151.113",
    "http://localhost:3000"
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Activity logging function
const logActivity = (action, type, details, userId = 'System') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${action} ${type}: ${details} by ${userId}`);
  
  // Log to database if available
  query('INSERT INTO activity_log (action, type, details, user_id) VALUES ($1, $2, $3, $4)', 
    [action, type, details, userId]).catch(err => {
    console.log('Activity log failed (database not available):', err.message);
  });
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'Connected' : 'Not configured'
  });
});

// Departments API
app.get('/api/departments', async (req, res) => {
  try {
    const result = await query('SELECT * FROM departments ORDER BY created_at DESC');
    res.json({
      success: true,
      departments: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch departments' });
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    const { name, code, type, head_of_department, email, phone, address, budget } = req.body;
    
    const result = await query(`
      INSERT INTO departments (name, code, type, head_of_department, email, phone, address, budget)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [name, code, type, head_of_department, email, phone, address, budget]);
    
    const newDepartment = result.rows[0];
    logActivity('Created', 'department', `${newDepartment.name} (${newDepartment.code})`);
    
    res.status(201).json({ success: true, department: newDepartment });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ success: false, error: 'Failed to create department' });
  }
});

// Vehicles API
app.get('/api/vehicles', async (req, res) => {
  try {
    const result = await query('SELECT * FROM vehicles ORDER BY created_at DESC');
    res.json({
      success: true,
      vehicles: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch vehicles' });
  }
});

app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM vehicles WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    res.json({ success: true, vehicle: result.rows[0] });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch vehicle' });
  }
});

app.post('/api/vehicles', async (req, res) => {
  try {
    const { plate_number, make, model, year, color, vin_number, vehicle_type, department, department_id, current_operator, gps_tracker, fuel_level, mileage, last_location, last_maintenance, next_maintenance, gsa_code, engine_number, chassis_number, registration_date, insurance_expiry, road_tax_expiry, assigned_driver, driver_license, contact_number, notes } = req.body;
    
    const result = await query(`
      INSERT INTO vehicles (
        plate_number, make, model, year, color, vin_number, vehicle_type, 
        department, department_id, current_operator, gps_tracker, fuel_level, 
        mileage, last_location, last_maintenance, next_maintenance, gsa_code, 
        engine_number, chassis_number, registration_date, insurance_expiry, 
        road_tax_expiry, assigned_driver, driver_license, contact_number, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      RETURNING *
    `, [
      plate_number, make, model, year, color, vin_number, vehicle_type,
      department, department_id, current_operator, gps_tracker, fuel_level,
      mileage, last_location, last_maintenance, next_maintenance, gsa_code,
      engine_number, chassis_number, registration_date, insurance_expiry,
      road_tax_expiry, assigned_driver, driver_license, contact_number, notes
    ]);
    
    const newVehicle = result.rows[0];
    logActivity('Created', 'vehicle', `${newVehicle.plate_number} - ${newVehicle.make} ${newVehicle.model}`);
    
    res.status(201).json({ success: true, vehicle: newVehicle });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ success: false, error: 'Failed to create vehicle' });
  }
});

// Facilities API
app.get('/api/facilities', async (req, res) => {
  try {
    const result = await query('SELECT * FROM facilities ORDER BY created_at DESC');
    res.json({
      success: true,
      facilities: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch facilities' });
  }
});

app.post('/api/facilities', async (req, res) => {
  try {
    const { name, type, department, department_id, address, coordinates, status, capacity, contact_person, phone } = req.body;
    
    const result = await query(`
      INSERT INTO facilities (name, type, department, department_id, address, coordinates, status, capacity, contact_person, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [name, type, department, department_id, address, coordinates, status, capacity, contact_person, phone]);
    
    const newFacility = result.rows[0];
    logActivity('Created', 'facility', `${newFacility.name} (${newFacility.type})`);
    
    res.status(201).json({ success: true, facility: newFacility });
  } catch (error) {
    console.error('Error creating facility:', error);
    res.status(500).json({ success: false, error: 'Failed to create facility' });
  }
});

// Equipment API
app.get('/api/equipment', async (req, res) => {
  try {
    const facilityId = req.query.facilityId;
    let queryText = 'SELECT * FROM equipment ORDER BY created_at DESC';
    let params = [];
    
    if (facilityId) {
      queryText = 'SELECT * FROM equipment WHERE department_id = $1 ORDER BY created_at DESC';
      params = [facilityId];
    }
    
    const result = await query(queryText, params);
    res.json({
      success: true,
      equipment: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch equipment' });
  }
});

app.post('/api/equipment', async (req, res) => {
  try {
    const { name, brand, model, serial_number, type, category, department, department_id, assigned_to, status, condition, location, purchase_date, purchase_price, warranty_expiry, last_maintenance, useful_life, salvage_value, gsa_code, asset_tag, supplier, invoice_number, notes } = req.body;
    
    const result = await query(`
      INSERT INTO equipment (
        name, brand, model, serial_number, type, category, department, department_id, 
        assigned_to, status, condition, location, purchase_date, purchase_price, 
        warranty_expiry, last_maintenance, useful_life, salvage_value, gsa_code, 
        asset_tag, supplier, invoice_number, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *
    `, [
      name, brand, model, serial_number, type, category, department, department_id,
      assigned_to, status, condition, location, purchase_date, purchase_price,
      warranty_expiry, last_maintenance, useful_life, salvage_value, gsa_code,
      asset_tag, supplier, invoice_number, notes
    ]);
    
    const newEquipment = result.rows[0];
    logActivity('Created', 'equipment', `${newEquipment.name} (${newEquipment.brand} ${newEquipment.model})`);
    
    res.status(201).json({ success: true, equipment: newEquipment });
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to create equipment' });
  }
});

// Employees API
app.get('/api/employees', async (req, res) => {
  try {
    const result = await query('SELECT * FROM employees ORDER BY created_at DESC');
    res.json({
      success: true,
      employees: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch employees' });
  }
});

// Also support /api/personnel for compatibility
app.get('/api/personnel', async (req, res) => {
  try {
    const result = await query('SELECT * FROM employees ORDER BY created_at DESC');
    res.json({
      success: true,
      personnel: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching personnel:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch personnel' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { full_name, badge_number, email, phone, position, department, department_id, clearance_level, status, hire_date } = req.body;
    
    const result = await query(`
      INSERT INTO employees (full_name, badge_number, email, phone, position, department, department_id, clearance_level, status, hire_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [full_name, badge_number, email, phone, position, department, department_id, clearance_level, status, hire_date]);
    
    const newEmployee = result.rows[0];
    logActivity('Created', 'employee', `${newEmployee.full_name} (${newEmployee.position})`);
    
    res.status(201).json({ success: true, employee: newEmployee });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ success: false, error: 'Failed to create employee' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, badge_number, email, phone, position, department, department_id, clearance_level, status, hire_date } = req.body;
    
    const result = await query(`
      UPDATE employees 
      SET full_name=$1, badge_number=$2, email=$3, phone=$4, position=$5, department=$6, department_id=$7, clearance_level=$8, status=$9, hire_date=$10
      WHERE id=$11
      RETURNING *
    `, [full_name, badge_number, email, phone, position, department, department_id, clearance_level, status, hire_date, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    
    logActivity('Updated', 'employee', `${full_name} (${position})`);
    
    res.json({ success: true, employee: result.rows[0] });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ success: false, error: 'Failed to update employee' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM employees WHERE id=$1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    
    logActivity('Deleted', 'employee', result.rows[0].full_name);
    
    res.json({ success: true, message: 'Employee deleted' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, error: 'Failed to delete employee' });
  }
});

app.get('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM employees WHERE id=$1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    
    res.json({ success: true, employee: result.rows[0] });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch employee' });
  }
});

// Stock Inventory API
app.get('/api/stock', async (req, res) => {
  try {
    const result = await query('SELECT * FROM stock_inventory ORDER BY created_at DESC');
    res.json({
      success: true,
      stock: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stock' });
  }
});

// Also support /api/stock/inventory for compatibility
app.get('/api/stock/inventory', async (req, res) => {
  try {
    const result = await query('SELECT * FROM stock_inventory ORDER BY created_at DESC');
    res.json({
      success: true,
      stock: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stock' });
  }
});

app.post('/api/stock', async (req, res) => {
  try {
    const { name, sku, category, quantity, unit, unit_price, minimum_level, location, department, supplier, last_restocked, status } = req.body;
    
    const result = await query(`
      INSERT INTO stock_inventory (name, sku, category, quantity, unit, unit_price, minimum_level, location, department, supplier, last_restocked, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [name, sku, category, quantity, unit, unit_price, minimum_level, location, department, supplier, last_restocked, status]);
    
    const newStock = result.rows[0];
    logActivity('Created', 'stock', `${newStock.name} (${newStock.quantity} ${newStock.unit})`);
    
    res.status(201).json({ success: true, stock: newStock });
  } catch (error) {
    console.error('Error creating stock item:', error);
    res.status(500).json({ success: false, error: 'Failed to create stock item' });
  }
});

// Goods Release API
app.get('/api/goods-releases', async (req, res) => {
  try {
    const result = await query('SELECT * FROM goods_releases ORDER BY release_date DESC');
    res.json({
      success: true,
      releases: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching goods releases:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch goods releases' });
  }
});

app.post('/api/goods-releases', async (req, res) => {
  try {
    const { stock_item_id, item_name, quantity, requesting_mac, destination_facility, released_by, status, delivered_at, facility_confirmation, completed_at } = req.body;
    
    const result = await query(`
      INSERT INTO goods_releases (stock_item_id, item_name, quantity, requesting_mac, destination_facility, released_by, status, delivered_at, facility_confirmation, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [stock_item_id, item_name, quantity, requesting_mac, destination_facility, released_by, status, delivered_at, facility_confirmation, completed_at]);
    
    const newRelease = result.rows[0];
    logActivity('Created', 'goods_release', `${newRelease.item_name} (${newRelease.quantity} units) to ${newRelease.destination_facility}`);
    
    res.status(201).json({ success: true, release: newRelease });
  } catch (error) {
    console.error('Error creating goods release:', error);
    res.status(500).json({ success: false, error: 'Failed to create goods release' });
  }
});

// Notifications API
app.get('/api/notifications', async (req, res) => {
  try {
    const result = await query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
    res.json({
      success: true,
      notifications: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// Search API
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ success: true, results: [] });
    }
    
    const searchTerm = `%${q}%`;
    
    // Search across multiple tables
    const [vehicles, departments, facilities, equipment, employees, stock] = await Promise.all([
      query('SELECT id, plate_number as name, make, model, \'vehicle\' as type FROM vehicles WHERE plate_number ILIKE $1 OR make ILIKE $1 OR model ILIKE $1', [searchTerm]),
      query('SELECT id, name, code, \'department\' as type FROM departments WHERE name ILIKE $1 OR code ILIKE $1', [searchTerm]),
      query('SELECT id, name, type FROM facilities WHERE name ILIKE $1 OR type ILIKE $1', [searchTerm]),
      query('SELECT id, name, brand, model, \'equipment\' as type FROM equipment WHERE name ILIKE $1 OR brand ILIKE $1 OR model ILIKE $1', [searchTerm]),
      query('SELECT id, full_name as name, position, \'employee\' as type FROM employees WHERE full_name ILIKE $1 OR position ILIKE $1', [searchTerm]),
      query('SELECT id, name, category, \'stock\' as type FROM stock_inventory WHERE name ILIKE $1 OR category ILIKE $1', [searchTerm])
    ]);
    
    const results = [
      ...vehicles.rows,
      ...departments.rows,
      ...facilities.rows,
      ...equipment.rows,
      ...employees.rows,
      ...stock.rows
    ];
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize Database Connection
initDatabase();

// Initialize GPS Tracking System
const gpsHandler = new GPSHandler({ app, io });
gpsHandler.init();

// Initialize Notification System
const notificationSystem = new NotificationSystem({ app, io });

// Initialize BW32 GPS Ingestor
const bw32Ingestor = new BW32Ingestor({ port: 50100 });

// Start server
const startServer = async () => {
  try {
    server.listen(DEFAULT_PORT, () => {
      console.log(`🚀 Server running on port ${DEFAULT_PORT}`);
      console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
      console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`📡 GPS Ingestor: Port 50100`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
