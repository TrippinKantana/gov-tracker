-- Government Asset Tracking & Security Platform Database Schema
-- PostgreSQL with PostGIS extension for geospatial data

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and role-based access
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'official', 'operator', 'viewer')),
    department VARCHAR(100),
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset categories table
CREATE TABLE asset_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets table - main assets registry
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id VARCHAR(50) UNIQUE NOT NULL, -- Human readable ID like VH001, FC001
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES asset_categories(id),
    type VARCHAR(50) NOT NULL, -- vehicle, facility, device, equipment
    description TEXT,
    make_model VARCHAR(255),
    serial_number VARCHAR(255),
    purchase_date DATE,
    purchase_cost DECIMAL(10,2),
    warranty_expiry DATE,
    assigned_department VARCHAR(100),
    assigned_user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired', 'lost')),
    current_location GEOMETRY(POINT, 4326), -- GPS coordinates
    facility_location VARCHAR(255), -- Building/facility name
    has_gps_tracker BOOLEAN DEFAULT FALSE,
    tracker_device_id VARCHAR(100), -- Lantern SOS Tracker ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset tracking history - GPS location updates
CREATE TABLE asset_tracking (
    id BIGSERIAL PRIMARY KEY,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    location GEOMETRY(POINT, 4326) NOT NULL,
    altitude DECIMAL(8,2),
    speed DECIMAL(6,2), -- km/h
    heading DECIMAL(5,2), -- degrees
    accuracy DECIMAL(6,2), -- meters
    battery_level INTEGER, -- percentage
    ignition_status BOOLEAN,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source VARCHAR(50) DEFAULT 'gps_tracker' -- gps_tracker, manual, mobile_app
);

-- Create index for fast location queries
CREATE INDEX idx_asset_tracking_location ON asset_tracking USING GIST(location);
CREATE INDEX idx_asset_tracking_asset_time ON asset_tracking(asset_id, timestamp DESC);

-- Asset check-in/check-out log
CREATE TABLE asset_transactions (
    id BIGSERIAL PRIMARY KEY,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('check_out', 'check_in', 'maintenance', 'repair', 'retire')),
    location VARCHAR(255),
    notes TEXT,
    previous_user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance records
CREATE TABLE maintenance_records (
    id BIGSERIAL PRIMARY KEY,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(50) NOT NULL, -- routine, repair, inspection
    description TEXT NOT NULL,
    cost DECIMAL(10,2),
    performed_by VARCHAR(255),
    vendor VARCHAR(255),
    scheduled_date DATE,
    completed_date DATE,
    next_due_date DATE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts and notifications
CREATE TABLE alerts (
    id BIGSERIAL PRIMARY KEY,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- unauthorized_movement, maintenance_due, low_battery, sos_activated
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Facilities table for government buildings
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- ministry, hospital, school, police_station, military_base
    address TEXT,
    location GEOMETRY(POINT, 4326),
    department VARCHAR(100),
    capacity INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset assignments to facilities
CREATE TABLE asset_facility_assignments (
    id BIGSERIAL PRIMARY KEY,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    is_current BOOLEAN DEFAULT TRUE
);

-- Insert initial asset categories
INSERT INTO asset_categories (name, description, icon) VALUES
('Vehicles', 'Government vehicles including cars, motorcycles, trucks', 'truck'),
('IT Equipment', 'Computers, tablets, phones, networking equipment', 'computer'),
('Office Equipment', 'Furniture, printers, projectors, office supplies', 'briefcase'),
('Medical Equipment', 'Hospital and clinic equipment', 'medical'),
('Security Equipment', 'Cameras, radios, protective gear', 'shield'),
('Facilities', 'Government buildings and infrastructure', 'building');

-- Insert sample admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role, department, full_name) VALUES
('admin', 'admin@gsa.gov.lr', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'General Services Agency', 'System Administrator');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
