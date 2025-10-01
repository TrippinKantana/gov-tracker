-- Government Asset Tracking Database Schema
-- PostgreSQL + PostGIS Recommended Implementation

-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE ENTITIES
-- =============================================================================

-- Departments/MACs (Ministries, Agencies, Commissions)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL, -- MOH, MOJ, etc.
    type VARCHAR(50) NOT NULL, -- ministry, agency, commission
    head_of_department VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    location GEOGRAPHY(POINT, 4326), -- PostGIS for facility location
    budget DECIMAL(15, 2),
    status VARCHAR(20) DEFAULT 'active',
    established_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personnel Management
CREATE TABLE personnel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    badge_number VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(50),
    department_id UUID REFERENCES departments(id),
    position VARCHAR(255),
    clearance_level VARCHAR(20) DEFAULT 'standard',
    date_hired DATE,
    facility_assignment VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ASSETS
-- =============================================================================

-- Vehicles/Fleet
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gsa_code VARCHAR(50) UNIQUE,
    plate_number VARCHAR(50) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    color VARCHAR(50),
    vin_number VARCHAR(17) UNIQUE,
    serial_number VARCHAR(100),
    engine_number VARCHAR(100),
    
    -- Assignment
    department_id UUID REFERENCES departments(id),
    current_operator_id UUID REFERENCES personnel(id),
    assignment VARCHAR(255),
    
    -- Financial
    cost DECIMAL(12, 2),
    donor VARCHAR(255),
    life_cycle VARCHAR(50),
    
    -- Operational
    status VARCHAR(20) DEFAULT 'active',
    fuel_type VARCHAR(50),
    power_rating VARCHAR(100),
    running_hours VARCHAR(100),
    current_mileage INTEGER DEFAULT 0,
    
    -- Maintenance
    maintenance_interval_km INTEGER DEFAULT 5000,
    last_maintenance_date DATE,
    last_maintenance_mileage INTEGER,
    next_maintenance_due_mileage INTEGER,
    
    -- Administrative
    entry_date DATE NOT NULL,
    entered_by VARCHAR(255) NOT NULL,
    registration_date DATE,
    
    -- Location tracking
    current_location GEOGRAPHY(POINT, 4326), -- PostGIS for real-time location
    last_known_location VARCHAR(255),
    
    -- GPS Tracking
    gps_device_id VARCHAR(50),
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_year CHECK (year BETWEEN 1990 AND EXTRACT(YEAR FROM NOW()) + 2)
);

-- Equipment
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gsa_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    
    -- Assignment
    department_id UUID REFERENCES departments(id),
    current_user_id UUID REFERENCES personnel(id),
    assignment VARCHAR(255),
    office_room VARCHAR(100),
    
    -- Technical
    specifications TEXT,
    power_rating VARCHAR(100),
    connectivity VARCHAR(255),
    operating_system VARCHAR(100),
    
    -- Financial
    cost DECIMAL(12, 2),
    donor VARCHAR(255),
    life_cycle VARCHAR(50),
    purchase_date DATE,
    warranty_expiry DATE,
    
    -- Maintenance
    maintenance_interval_months INTEGER DEFAULT 12,
    last_maintenance_date DATE,
    next_maintenance_due DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    condition VARCHAR(20) DEFAULT 'excellent',
    
    -- Administrative
    entry_date DATE NOT NULL,
    entered_by VARCHAR(255) NOT NULL,
    
    -- Location
    location GEOGRAPHY(POINT, 4326), -- PostGIS for equipment location
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facilities
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    department_id UUID REFERENCES departments(id),
    address TEXT,
    location GEOGRAPHY(POINT, 4326), -- PostGIS for facility coordinates
    capacity INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    manager_id UUID REFERENCES personnel(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- GPS TRACKING
-- =============================================================================

-- GPS Devices
CREATE TABLE gps_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) UNIQUE NOT NULL, -- IMEI
    name VARCHAR(255),
    model VARCHAR(100) DEFAULT 'BW32',
    vehicle_id UUID REFERENCES vehicles(id),
    status VARCHAR(20) DEFAULT 'active',
    last_seen_at TIMESTAMPTZ,
    battery_level INTEGER,
    signal_strength INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GPS Position History
CREATE TABLE gps_positions (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id),
    location GEOGRAPHY(POINT, 4326) NOT NULL, -- PostGIS for coordinates
    speed_kph DECIMAL(6, 2),
    course_deg DECIMAL(5, 2),
    altitude_m DECIMAL(8, 2),
    gps_valid BOOLEAN DEFAULT true,
    satellites INTEGER,
    hdop DECIMAL(4, 2),
    battery_voltage DECIMAL(4, 2),
    gsm_signal INTEGER,
    fix_time_utc TIMESTAMPTZ NOT NULL,
    raw_data JSONB, -- Store original BW32 protocol data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- MAINTENANCE & OPERATIONS
-- =============================================================================

-- Maintenance Records
CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_type VARCHAR(20) NOT NULL, -- vehicle, equipment
    asset_id UUID NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    maintenance_date DATE NOT NULL,
    mileage INTEGER, -- For vehicles
    cost DECIMAL(10, 2),
    provider VARCHAR(255),
    status VARCHAR(20) DEFAULT 'completed',
    next_due_date DATE,
    next_due_mileage INTEGER, -- For vehicles
    notes TEXT,
    parts_used TEXT[],
    performed_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- security, maintenance, system, assignment, compliance
    priority VARCHAR(20) NOT NULL, -- urgent, high, medium, low
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    user_id UUID, -- NULL for system-wide notifications
    department_id UUID REFERENCES departments(id), -- Department-specific notifications
    asset_type VARCHAR(20), -- vehicle, equipment, facility
    asset_id UUID,
    data JSONB, -- Additional notification data
    channels VARCHAR(50)[] DEFAULT ARRAY['in-app'], -- in-app, email, desktop
    read_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- AUDIT & COMPLIANCE
-- =============================================================================

-- Asset Transfer History
CREATE TABLE asset_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_type VARCHAR(20) NOT NULL,
    asset_id UUID NOT NULL,
    from_department_id UUID REFERENCES departments(id),
    to_department_id UUID REFERENCES departments(id),
    from_personnel_id UUID REFERENCES personnel(id),
    to_personnel_id UUID REFERENCES personnel(id),
    transfer_reason TEXT,
    transferred_by UUID REFERENCES personnel(id),
    approved_by UUID REFERENCES personnel(id),
    transfer_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Audit Log
CREATE TABLE asset_audit_log (
    id BIGSERIAL PRIMARY KEY,
    asset_type VARCHAR(20) NOT NULL,
    asset_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- created, updated, transferred, deleted
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES personnel(id),
    change_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Core entity indexes
CREATE INDEX idx_vehicles_department ON vehicles(department_id);
CREATE INDEX idx_vehicles_gsa_code ON vehicles(gsa_code);
CREATE INDEX idx_vehicles_plate ON vehicles(plate_number);
CREATE INDEX idx_equipment_department ON equipment(department_id);
CREATE INDEX idx_equipment_gsa_code ON equipment(gsa_code);
CREATE INDEX idx_personnel_department ON personnel(department_id);

-- GPS tracking indexes (critical for performance)
CREATE INDEX idx_gps_positions_vehicle_time ON gps_positions(vehicle_id, fix_time_utc DESC);
CREATE INDEX idx_gps_positions_device_time ON gps_positions(device_id, fix_time_utc DESC);
CREATE INDEX idx_gps_positions_location ON gps_positions USING GIST(location); -- PostGIS spatial index
CREATE INDEX idx_gps_positions_time ON gps_positions(fix_time_utc DESC);

-- Notification indexes
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_department ON notifications(department_id);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Maintenance indexes
CREATE INDEX idx_maintenance_asset ON maintenance_records(asset_type, asset_id);
CREATE INDEX idx_maintenance_date ON maintenance_records(maintenance_date DESC);

-- Audit indexes
CREATE INDEX idx_audit_log_asset ON asset_audit_log(asset_type, asset_id);
CREATE INDEX idx_audit_log_time ON asset_audit_log(created_at DESC);

-- =============================================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =============================================================================

-- Update vehicle location from GPS
CREATE OR REPLACE FUNCTION update_vehicle_location(
    p_vehicle_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL
) RETURNS VOID AS $$
BEGIN
    UPDATE vehicles 
    SET current_location = ST_Point(p_longitude, p_latitude)::GEOGRAPHY,
        updated_at = NOW()
    WHERE id = p_vehicle_id;
END;
$$ LANGUAGE plpgsql;

-- Calculate next maintenance due
CREATE OR REPLACE FUNCTION calculate_next_maintenance(
    p_vehicle_id UUID,
    p_current_mileage INTEGER
) RETURNS INTEGER AS $$
DECLARE
    maintenance_interval INTEGER;
    last_maintenance_mileage INTEGER;
BEGIN
    SELECT maintenance_interval_km, COALESCE(last_maintenance_mileage, 0)
    INTO maintenance_interval, last_maintenance_mileage
    FROM vehicles
    WHERE id = p_vehicle_id;
    
    RETURN last_maintenance_mileage + maintenance_interval;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Active Assets Summary
CREATE VIEW active_assets_summary AS
SELECT 
    d.name as department_name,
    d.code as department_code,
    COUNT(v.*) as vehicle_count,
    COUNT(e.*) as equipment_count,
    COUNT(f.*) as facility_count
FROM departments d
LEFT JOIN vehicles v ON d.id = v.department_id AND v.status = 'active'
LEFT JOIN equipment e ON d.id = e.department_id AND e.status = 'active'
LEFT JOIN facilities f ON d.id = f.department_id AND f.status = 'active'
GROUP BY d.id, d.name, d.code;

-- Vehicle GPS Status
CREATE VIEW vehicle_gps_status AS
SELECT 
    v.id,
    v.plate_number,
    v.make,
    v.model,
    d.name as department_name,
    gd.device_id,
    gd.last_seen_at,
    CASE 
        WHEN gd.last_seen_at > NOW() - INTERVAL '30 minutes' THEN 'online'
        WHEN gd.last_seen_at > NOW() - INTERVAL '2 hours' THEN 'delayed'
        ELSE 'offline'
    END as gps_status,
    ST_Y(v.current_location::GEOMETRY) as latitude,
    ST_X(v.current_location::GEOMETRY) as longitude
FROM vehicles v
LEFT JOIN departments d ON v.department_id = d.id
LEFT JOIN gps_devices gd ON v.id = gd.vehicle_id
WHERE v.status = 'active';

-- Maintenance Due Report
CREATE VIEW maintenance_due_report AS
SELECT 
    'vehicle' as asset_type,
    v.id as asset_id,
    v.plate_number as asset_name,
    v.current_mileage,
    v.maintenance_interval_km,
    v.last_maintenance_mileage,
    (v.last_maintenance_mileage + v.maintenance_interval_km) as next_due_mileage,
    CASE 
        WHEN v.current_mileage >= (v.last_maintenance_mileage + v.maintenance_interval_km) THEN 'overdue'
        WHEN v.current_mileage >= (v.last_maintenance_mileage + v.maintenance_interval_km - 500) THEN 'due_soon'
        ELSE 'ok'
    END as maintenance_status,
    d.name as department_name
FROM vehicles v
LEFT JOIN departments d ON v.department_id = d.id
WHERE v.status = 'active'

UNION ALL

SELECT 
    'equipment' as asset_type,
    e.id as asset_id,
    e.name as asset_name,
    NULL as current_mileage,
    e.maintenance_interval_months,
    NULL as last_maintenance_mileage,
    NULL as next_due_mileage,
    CASE 
        WHEN e.next_maintenance_due <= CURRENT_DATE THEN 'overdue'
        WHEN e.next_maintenance_due <= CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
        ELSE 'ok'
    END as maintenance_status,
    d.name as department_name
FROM equipment e
LEFT JOIN departments d ON e.department_id = d.id
WHERE e.status = 'active';

-- =============================================================================
-- SAMPLE DATA
-- =============================================================================

-- Insert sample departments
INSERT INTO departments (name, code, type, head_of_department, email, phone, address) VALUES
('Ministry of Health', 'MOH', 'ministry', 'Dr. Sarah Johnson', 'info@health.gov.lr', '+231-555-0101', 'Capitol Hill, Monrovia'),
('Ministry of Justice', 'MOJ', 'ministry', 'Hon. James Wilson', 'info@justice.gov.lr', '+231-555-0102', 'Temple of Justice, Monrovia'),
('Ministry of Agriculture', 'MOA', 'ministry', 'Mr. David Brown', 'info@agriculture.gov.lr', '+231-555-0103', 'Ministerial Complex, Congo Town'),
('General Services Agency', 'GSA', 'agency', 'Ms. Lisa Thompson', 'info@gsa.gov.lr', '+231-555-0104', 'Executive Mansion, Monrovia');

-- Create admin user for testing
INSERT INTO personnel (full_name, badge_number, email, department_id, position, clearance_level) 
SELECT 'System Administrator', 'ADMIN001', 'admin@gov-tracker.lr', d.id, 'System Administrator', 'top_secret'
FROM departments d WHERE d.code = 'GSA' LIMIT 1;
