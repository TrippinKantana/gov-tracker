# Database Setup Instructions

## 1. PostgreSQL Installation & Configuration

### Install PostgreSQL with PostGIS
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib postgis

# Windows
# Download and install from: https://www.postgresql.org/download/windows/
# Include PostGIS extension during installation

# macOS
brew install postgresql postgis
```

### Start PostgreSQL Service
```bash
# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl enable postgresql

# macOS
brew services start postgresql

# Windows
# Service starts automatically after installation
```

## 2. Database Creation

### Create Database and User
```sql
-- Connect as postgres superuser
sudo -u postgres psql

-- Create database
CREATE DATABASE gov_tracker;

-- Create user with proper permissions
CREATE USER gov_tracker_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE gov_tracker TO gov_tracker_user;

-- Connect to the database
\c gov_tracker

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Grant permissions on extensions
GRANT ALL ON ALL TABLES IN SCHEMA public TO gov_tracker_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO gov_tracker_user;
```

### Run Schema Creation
```bash
# From the project root
psql -U gov_tracker_user -d gov_tracker -f database/complete-schema.sql
```

## 3. Environment Configuration

### Update Backend .env
```bash
# Copy the example file
cp backend/.env.example backend/.env

# Edit with your actual values
DATABASE_URL=postgresql://gov_tracker_user:secure_password_here@localhost:5432/gov_tracker
POSTGRES_USER=gov_tracker_user
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=gov_tracker

# GPS Device Configuration
MQTT_BROKER_URL=mqtt://your-mqtt-broker:1883
MQTT_USERNAME=gps_client
MQTT_PASSWORD=mqtt_secure_password
GPS_API_KEY=your_lantern_sos_api_key
```

## 4. Install Dependencies

### Backend Dependencies
```bash
cd backend
npm install pg @types/pg mqtt @types/mqtt
```

### Run Database Migrations
```bash
# Start the backend server to test database connection
npm run dev

# You should see:
# ✅ Connected to PostgreSQL database
# ✅ Connected to MQTT broker for GPS devices
# Server running on port 5000
```

## 5. Testing Database Integration

### Test Personnel API
```bash
# Create personnel
curl -X POST http://localhost:5000/api/personnel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fullName": "John Doe",
    "badgeNumber": "TEST-001",
    "department": "Ministry of Health",
    "position": "Test Officer"
  }'

# List personnel
curl http://localhost:5000/api/personnel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Departments API
```bash
# Create department
curl -X POST http://localhost:5000/api/departments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Ministry of Health",
    "code": "MOH",
    "type": "ministry",
    "headOfDepartment": "Dr. Jane Smith"
  }'

# List departments
curl http://localhost:5000/api/departments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 6. GPS Device Integration Testing

### Test GPS Device Registration
```bash
# Register GPS device
curl -X POST http://localhost:5000/api/gps-devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "deviceId": "LANTERN-001",
    "imei": "123456789012345",
    "phoneNumber": "+231555001",
    "vehicleId": "vehicle-uuid-here"
  }'
```

### Test Vehicle Command
```bash
# Send engine kill command
curl -X POST http://localhost:5000/api/gps-devices/LANTERN-001/command \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "command": "engine_kill",
    "parameters": {"reason": "emergency_stop"}
  }'
```

## 7. Production Deployment Checklist

- [ ] PostgreSQL database configured with PostGIS
- [ ] Database schema deployed (`complete-schema.sql`)
- [ ] Environment variables configured
- [ ] MQTT broker connected for GPS devices
- [ ] Auth0 JWT verification working
- [ ] All API endpoints tested
- [ ] Audit logging functional
- [ ] GPS device integration tested
- [ ] Frontend pointing to real APIs (no localStorage)
- [ ] Database backups configured
- [ ] SSL certificates configured for production
