-- Government Asset Tracking & Security Platform - Production Schema
-- PostgreSQL with PostGIS for geospatial tracking
-- Designed for Neon serverless PostgreSQL

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments / MACs table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ministry', 'agency', 'bureau', 'commission', 'authority')),
    head_of_department VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    budget DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    employee_count INTEGER DEFAULT 0,
    vehicle_count INTEGER DEFAULT 0,
    facility_count INTEGER DEFAULT 0,
    equipment_count INTEGER DEFAULT 0,
    established_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(50) UNIQUE NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    color VARCHAR(50),
    vin_number VARCHAR(100) UNIQUE,
    vehicle_type VARCHAR(50) CHECK (vehicle_type IN ('car', 'truck', 'van', 'motorcycle', 'bus', 'ambulance')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired')),
    department VARCHAR(255),
    department_id UUID REFERENCES departments(id),
    current_operator VARCHAR(255),
    gps_tracker VARCHAR(100),
    fuel_level INTEGER,
    mileage DECIMAL(10,2),
    last_location VARCHAR(255),
    last_maintenance DATE,
    next_maintenance DATE,
    last_update TIMESTAMP WITH TIME ZONE,
    gsa_code VARCHAR(100),
    engine_number VARCHAR(100),
    chassis_number VARCHAR(100),
    registration_date DATE,
    insurance_expiry DATE,
    road_tax_expiry DATE,
    assigned_driver VARCHAR(255),
    driver_license VARCHAR(100),
    contact_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle maintenance records
CREATE TABLE vehicle_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    performed_by VARCHAR(255),
    date DATE NOT NULL,
    cost DECIMAL(10,2),
    next_due_date DATE,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Facilities table
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    department VARCHAR(255),
    department_id UUID REFERENCES departments(id),
    address TEXT,
    coordinates POINT, -- Using simple POINT instead of PostGIS for easier setup
    status VARCHAR(20) DEFAULT 'operational',
    capacity INTEGER,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Facility maintenance records
CREATE TABLE facility_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    performed_by VARCHAR(255),
    date DATE NOT NULL,
    cost DECIMAL(10,2),
    next_due_date DATE,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment table
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    type VARCHAR(50),
    category VARCHAR(50),
    department VARCHAR(255),
    department_id UUID REFERENCES departments(id),
    assigned_to VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    condition VARCHAR(20),
    location VARCHAR(255),
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    warranty_expiry DATE,
    last_maintenance DATE,
    useful_life INTEGER,
    salvage_value DECIMAL(10,2),
    gsa_code VARCHAR(100),
    asset_tag VARCHAR(100),
    supplier VARCHAR(255),
    invoice_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees / Personnel table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    badge_number VARCHAR(100) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(50),
    position VARCHAR(100),
    department VARCHAR(255),
    department_id UUID REFERENCES departments(id),
    clearance_level VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    hire_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GPS Devices table
CREATE TABLE gps_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'available',
    battery_level INTEGER,
    signal VARCHAR(50),
    vehicle_id UUID REFERENCES vehicles(id),
    last_seen TIMESTAMP WITH TIME ZONE,
    sim_number VARCHAR(50),
    imei VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Inventory table
CREATE TABLE stock_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    category VARCHAR(50),
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50),
    unit_price DECIMAL(10,2),
    minimum_level INTEGER,
    location VARCHAR(255),
    department VARCHAR(255),
    supplier VARCHAR(255),
    last_restocked DATE,
    status VARCHAR(20) DEFAULT 'in_stock',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goods Release table
CREATE TABLE goods_releases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_item_id UUID REFERENCES stock_inventory(id),
    item_name VARCHAR(255),
    quantity INTEGER NOT NULL,
    requesting_mac VARCHAR(255),
    destination_facility VARCHAR(255),
    released_by VARCHAR(255),
    release_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'released',
    delivered_at TIMESTAMP WITH TIME ZONE,
    facility_confirmation JSONB,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Activity Log for audit trail
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    details TEXT,
    user_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip VARCHAR(50)
);

-- Create indexes for performance
CREATE INDEX idx_vehicles_department ON vehicles(department_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_equipment_department ON equipment(department_id);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_facilities_department ON facilities(department_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_stock_department ON stock_inventory(department);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_activity_timestamp ON activity_log(timestamp DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_departments_updated_at 
    BEFORE UPDATE ON departments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at 
    BEFORE UPDATE ON vehicles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at 
    BEFORE UPDATE ON facilities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at 
    BEFORE UPDATE ON equipment 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at 
    BEFORE UPDATE ON employees 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_updated_at 
    BEFORE UPDATE ON stock_inventory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gps_devices_updated_at 
    BEFORE UPDATE ON gps_devices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

