# PostgreSQL + PostGIS Setup Guide - Windows

## 🪟 **Step 1: Install PostgreSQL + PostGIS (Windows)**

### **Option A: Official PostgreSQL Installer (Recommended)**

1. **Download PostgreSQL 16**
   - Go to: https://www.postgresql.org/download/windows/
   - Download the Windows x86-64 installer
   - File: `postgresql-16.x-x-windows-x64.exe`

2. **Run Installer**
   - **Installation Directory**: `C:\Program Files\PostgreSQL\17`
   - **Data Directory**: `C:\Program Files\PostgreSQL\17\data`
   - **Port**: `5432` (default)
   - **Superuser Password**: Choose a strong password (save it!)
   - **Locale**: Default

3. **Install PostGIS Extension**
   - During installation, check "Stack Builder" option
   - OR download separately: https://postgis.net/windows_downloads/
   - Select: PostGIS 3.4+ for PostgreSQL 17

### **Option B: Using Chocolatey (If you have it)**
```bash
# Run in PowerShell as Administrator
choco install postgresql
choco install postgis
```

## 🛠️ **Step 2: Set Up PostgreSQL Password (Easiest Method)**

### **Option A: Using pgAdmin (Recommended)**
1. **Open pgAdmin 4** (should be installed with PostgreSQL)
   - Look for "pgAdmin 4" in Start Menu
   - OR go to: http://localhost:80/pgadmin4
2. **Connect to Server**
   - Click "Add New Server"
   - **Name**: Local PostgreSQL 17
   - **Host**: localhost
   - **Port**: 5432
   - **Username**: postgres
   - **Password**: Leave empty first, then save
3. **Set Password**
   - Right-click "Login/Group Roles" → "postgres"
   - Go to "Definition" tab
   - **Password**: Enter `admin123!`
   - Click "Save"

### **Option B: Command Line Method**
**Path**: Press `Win + X` → Choose "Windows PowerShell (Admin)"

```bash
# Navigate to PostgreSQL bin directory
cd "C:\Program Files\PostgreSQL\17\bin"

# Try to connect (may work without password on fresh install)
.\psql.exe -U postgres

# If it connects, run this command to set password:
# ALTER USER postgres PASSWORD 'admin123!';
# \q

# If it asks for password, try just pressing Enter
# Then set the password using the command above
```

### **Create Database and User**
**Copy/paste these commands in the PostgreSQL prompt:**

```sql
-- Set password for postgres user (if you used Option B above)
ALTER USER postgres PASSWORD 'admin123!';

-- Create database
CREATE DATABASE gov_asset_tracker;

-- Create application user
CREATE USER gov_tracker_user WITH PASSWORD 'tracker123!';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE gov_asset_tracker TO gov_tracker_user;

-- Exit postgres user session
\q
```

### **If Connection Still Fails - Reset Password**
```bash
# Stop PostgreSQL service
net stop postgresql-x64-17

# Start in single-user mode and reset password
# Then restart service
net start postgresql-x64-17
```

### **Connect to Your Database**
```bash
# Still in C:\Program Files\PostgreSQL\17\bin
.\psql.exe -U gov_tracker_user -d gov_asset_tracker
```

### **Enable PostGIS Extension**
```sql
-- Enable PostGIS for geospatial features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS installation
SELECT PostGIS_Version();

-- You should see something like "3.4.0 r22408"
-- Exit
\q
```

## 📊 **Step 3: Create Schema**

### **Navigate to Your Project**
```bash
# Open new PowerShell window
cd "C:\Users\cyrus\Desktop\gov tracker"
```

### **Run Schema Creation**
```bash
# Import the database schema
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U gov_tracker_user -d gov_asset_tracker -f "database\recommended-schema.sql"
```

**Expected Output:**
```
CREATE EXTENSION
CREATE TABLE
CREATE TABLE
CREATE TABLE
...
CREATE INDEX
CREATE VIEW
INSERT 0 4
```

## 🔌 **Step 4: Install Node.js Dependencies**

### **Navigate to Backend**
```bash
cd "C:\Users\cyrus\Desktop\gov tracker\backend"
```

### **Install PostgreSQL Drivers**
```bash
npm install pg @types/pg dotenv
```

## ⚙️ **Step 5: Configure Backend Connection**

### **Create Database Configuration**
**Path**: `C:\Users\cyrus\Desktop\gov tracker\backend\.env`

**Add these lines to your `.env` file:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gov_asset_tracker
DB_USER=gov_tracker_user
DB_PASSWORD=tracker123!
DB_SSL=false

# Keep existing Auth0 and other settings...
```

### **Create Database Connection File**
**Path**: `C:\Users\cyrus\Desktop\gov tracker\backend\src\config\database.js`

```javascript
const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'gov_asset_tracker',
  user: process.env.DB_USER || 'gov_tracker_user',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true',
  max: 20, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('🚨 PostgreSQL pool error:', err);
});

// Test PostGIS
pool.query('SELECT PostGIS_Version()', (err, res) => {
  if (err) {
    console.error('🚨 PostGIS connection failed:', err);
  } else {
    console.log('🌍 PostGIS version:', res.rows[0].postgis_version);
  }
});

module.exports = pool;
```

## 🧪 **Step 6: Test the Connection**

### **Create Test File**
**Path**: `C:\Users\cyrus\Desktop\gov tracker\backend\test-db.js`

```javascript
const pool = require('./src/config/database');

async function testDatabase() {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time, PostGIS_Version() as postgis');
    console.log('✅ Database connected successfully');
    console.log('⏰ Current time:', result.rows[0].current_time);
    console.log('🌍 PostGIS version:', result.rows[0].postgis);
    
    // Test departments table
    const depts = await pool.query('SELECT COUNT(*) as dept_count FROM departments');
    console.log('🏛️ Departments in database:', depts.rows[0].dept_count);
    
    // Test PostGIS functionality
    const geoTest = await pool.query(`
      SELECT ST_AsText(ST_Point(-10.7969, 6.2907)) as monrovia_point
    `);
    console.log('📍 Monrovia coordinates test:', geoTest.rows[0].monrovia_point);
    
    console.log('🎉 All tests passed! Database is ready.');
    
  } catch (error) {
    console.error('🚨 Database test failed:', error);
  } finally {
    await pool.end();
  }
}

testDatabase();
```

### **Run Database Test**
```bash
# In C:\Users\cyrus\Desktop\gov tracker\backend
node test-db.js
```

**Expected Output:**
```
🧪 Testing database connection...
✅ Database connected successfully
⏰ Current time: 2024-01-15T10:30:00.000Z
🌍 PostGIS version: 3.4.0 r22408
🏛️ Departments in database: 4
📍 Monrovia coordinates test: POINT(-10.7969 6.2907)
🎉 All tests passed! Database is ready.
```

## 🔄 **Step 7: Update Backend to Use PostgreSQL**

### **Update server.js**
**Path**: `C:\Users\cyrus\Desktop\gov tracker\backend\server.js`

**Add at the top:**
```javascript
// Add after existing requires
const pool = require('./src/config/database');
```

**Replace mock data with database queries:**
```javascript
// Replace: app.get('/api/vehicles', (req, res) => {
app.get('/api/vehicles', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, d.name as department_name 
      FROM vehicles v 
      LEFT JOIN departments d ON v.department_id = d.id 
      WHERE v.status = 'active'
      ORDER BY v.created_at DESC
    `);
    
    res.json({
      success: true,
      vehicles: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});
```

## 📱 **Step 8: Test Integration**

### **Restart Backend**
```bash
# Stop current backend (Ctrl+C)
# Start with database integration
cd "C:\Users\cyrus\Desktop\gov tracker\backend"
npm run dev
```

### **Test API Endpoints**
```bash
# Test departments
curl http://localhost:5000/api/departments

# Test vehicles  
curl http://localhost:5000/api/vehicles

# Test notifications
curl http://localhost:5000/api/notifications
```

## 🎯 **Summary of Paths & Commands**

| Task | Path | Command |
|------|------|---------|
| **Install PostgreSQL** | Download from postgresql.org | Run installer |
| **Connect to DB** | `C:\Program Files\PostgreSQL\17\bin` | `.\psql.exe -U postgres` |
| **Create Schema** | `C:\Users\cyrus\Desktop\gov tracker` | `psql -f database\recommended-schema.sql` |
| **Install Dependencies** | `C:\Users\cyrus\Desktop\gov tracker\backend` | `npm install pg @types/pg` |
| **Test Database** | `C:\Users\cyrus\Desktop\gov tracker\backend` | `node test-db.js` |
| **Restart Backend** | `C:\Users\cyrus\Desktop\gov tracker\backend` | `npm run dev` |

## ⚡ **Quick Start (All Commands)**

```bash
# 1. Download and install PostgreSQL + PostGIS from postgresql.org

# 2. Setup database
cd "C:\Program Files\PostgreSQL\17\bin"
.\psql.exe -U postgres
# Run SQL commands from Step 2 above

# 3. Create schema
cd "C:\Users\cyrus\Desktop\gov tracker"
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U gov_tracker_user -d gov_asset_tracker -f "database\recommended-schema.sql"

# 4. Install Node dependencies
cd "C:\Users\cyrus\Desktop\gov tracker\backend"
npm install pg @types/pg

# 5. Test connection
node test-db.js

# 6. Start backend with database
npm run dev
```

This will give you a **production-ready, government-grade database** for your asset tracking platform with advanced GPS capabilities!
