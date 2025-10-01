-- Government Asset Tracking Platform - Complete Database Schema
-- PostgreSQL with PostGIS for geospatial capabilities

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- CORE GOVERNMENT STRUCTURE
-- =====================================================

-- Departments/MACs Table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ministry', 'agency', 'bureau', 'commission', 'authority')),
    head_of_department VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    budget BIGINT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'restructuring')),
    established_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Personnel Table (Government Staff for Asset Assignment)
CREATE TABLE personnel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    badge_number VARCHAR(50) UNIQUE NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    department_name VARCHAR(255) NOT NULL, -- Denormalized for easy filtering
    position VARCHAR(255) NOT NULL,
    clearance_level VARCHAR(50) DEFAULT 'standard' CHECK (clearance_level IN ('standard', 'confidential', 'secret', 'top_secret')),
    date_hired DATE,
    facility_assignment VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    vehicle_assignments JSONB DEFAULT '[]',
    equipment_assignments JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ASSET MANAGEMENT
-- =====================================================

-- Vehicles Table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    plate_number VARCHAR(50) UNIQUE NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    vehicle_type VARCHAR(100),
    color VARCHAR(50),
    vin_number VARCHAR(100) UNIQUE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    department_name VARCHAR(255) NOT NULL,
    current_operator_id UUID REFERENCES personnel(id) ON DELETE SET NULL,
    current_operator_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired')),
    fuel_level INTEGER CHECK (fuel_level >= 0 AND fuel_level <= 100),
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    mileage INTEGER DEFAULT 0,
    last_location VARCHAR(255),
    coordinates GEOMETRY(POINT, 4326), -- PostGIS for GPS coordinates
    gps_tracker_id VARCHAR(100) UNIQUE,
    engine_status VARCHAR(50) DEFAULT 'unknown' CHECK (engine_status IN ('running', 'stopped', 'unknown')),
    last_maintenance DATE,
    next_maintenance DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Facilities Table
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    coordinates GEOMETRY(POINT, 4326) NOT NULL, -- PostGIS for GPS coordinates
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    department_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'under_construction', 'closed')),
    security_level VARCHAR(50) DEFAULT 'low' CHECK (security_level IN ('low', 'medium', 'high', 'classified')),
    capacity INTEGER,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    occupancy_count INTEGER DEFAULT 0,
    access_controlled BOOLEAN DEFAULT false,
    last_security_check TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Equipment/Assets Table
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    serial_number VARCHAR(255) UNIQUE,
    model VARCHAR(255),
    manufacturer VARCHAR(255),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    department_name VARCHAR(255) NOT NULL,
    assigned_to_id UUID REFERENCES personnel(id) ON DELETE SET NULL,
    assigned_to_name VARCHAR(255),
    facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    facility_name VARCHAR(255),
    location VARCHAR(255), -- Room/area within facility
    coordinates GEOMETRY(POINT, 4326), -- PostGIS for GPS coordinates if applicable
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired')),
    condition VARCHAR(50) DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    purchase_date DATE,
    purchase_price DECIMAL(15,2),
    warranty_expiry DATE,
    last_maintenance DATE,
    next_maintenance DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- GPS TRACKING SYSTEM
-- =====================================================

-- GPS Devices Table (Lantern SOS Trackers)
CREATE TABLE gps_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100) UNIQUE NOT NULL, -- Physical device identifier
    device_type VARCHAR(50) DEFAULT 'lantern_sos',
    imei VARCHAR(50) UNIQUE,
    phone_number VARCHAR(50),
    sim_card_number VARCHAR(50),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    signal_strength INTEGER CHECK (signal_strength >= 0 AND signal_strength <= 100),
    firmware_version VARCHAR(50),
    last_ping TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- GPS Tracking Data Table (Live Location Data)
CREATE TABLE gps_tracking_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES gps_devices(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    coordinates GEOMETRY(POINT, 4326) NOT NULL,
    speed DECIMAL(5,2), -- km/h
    heading DECIMAL(5,2), -- degrees
    altitude DECIMAL(8,2), -- meters
    accuracy DECIMAL(5,2), -- meters
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_gps_tracking_vehicle_timestamp ON gps_tracking_data(vehicle_id, timestamp DESC);
CREATE INDEX idx_gps_tracking_coordinates ON gps_tracking_data USING GIST(coordinates);

-- =====================================================
-- AUDIT AND SECURITY
-- =====================================================

-- Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255), -- Auth0 user ID
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- 'personnel', 'vehicle', 'facility', etc.
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Asset Assignment History
CREATE TABLE asset_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_type VARCHAR(50) NOT NULL, -- 'vehicle', 'equipment'
    asset_id UUID NOT NULL,
    assigned_to_id UUID REFERENCES personnel(id) ON DELETE CASCADE,
    assigned_by VARCHAR(255), -- Auth0 user ID who made assignment
    assignment_date TIMESTAMP DEFAULT NOW(),
    unassignment_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATION SYSTEM
-- =====================================================

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('maintenance', 'alert', 'warning', 'info', 'emergency')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('vehicle', 'equipment', 'facility', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    asset_id UUID,
    asset_name VARCHAR(255),
    department_name VARCHAR(255),
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_read BOOLEAN DEFAULT false,
    is_email_sent BOOLEAN DEFAULT false,
    sound_played BOOLEAN DEFAULT false,
    due_date TIMESTAMP,
    action_required VARCHAR(255),
    location VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personnel_updated_at BEFORE UPDATE ON personnel FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gps_devices_updated_at BEFORE UPDATE ON gps_devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL INDEXES FOR PERFORMANCE
-- =====================================================

-- Personnel indexes
CREATE INDEX idx_personnel_department ON personnel(department_name);
CREATE INDEX idx_personnel_status ON personnel(status);
CREATE INDEX idx_personnel_badge ON personnel(badge_number);

-- Vehicle indexes
CREATE INDEX idx_vehicles_department ON vehicles(department_name);
CREATE INDEX idx_vehicles_plate ON vehicles(plate_number);
CREATE INDEX idx_vehicles_gps_tracker ON vehicles(gps_tracker_id);
CREATE INDEX idx_vehicles_coordinates ON vehicles USING GIST(coordinates);

-- Facility indexes
CREATE INDEX idx_facilities_department ON facilities(department_name);
CREATE INDEX idx_facilities_coordinates ON facilities USING GIST(coordinates);
CREATE INDEX idx_facilities_type ON facilities(type);

-- Equipment indexes
CREATE INDEX idx_equipment_department ON equipment(department_name);
CREATE INDEX idx_equipment_serial ON equipment(serial_number);
CREATE INDEX idx_equipment_assigned_to ON equipment(assigned_to_id);

-- Audit indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
