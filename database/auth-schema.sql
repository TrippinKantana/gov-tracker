-- Government-Grade Authentication & RBAC Database Schema
-- Compliant with NIST SP 800-63B and OWASP ASVS Level 2+

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table with Argon2id password hashing
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    badge_number VARCHAR(20) UNIQUE,
    
    -- Password security (Argon2id)
    password_hash TEXT NOT NULL, -- Argon2id hash
    password_salt BYTEA NOT NULL, -- Random salt per user
    argon2_time_cost INTEGER NOT NULL DEFAULT 3, -- NIST recommended minimum
    argon2_memory_cost INTEGER NOT NULL DEFAULT 65536, -- 64 MiB
    argon2_parallelism INTEGER NOT NULL DEFAULT 2,
    
    -- Account status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    requires_password_change BOOLEAN NOT NULL DEFAULT false,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    account_locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    last_login_user_agent TEXT,
    
    -- Department association (critical for RBAC)
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    clearance_level VARCHAR(20) DEFAULT 'standard' CHECK (clearance_level IN ('standard', 'elevated', 'high', 'restricted')),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Add indexes for performance and security
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_badge_number ON users(badge_number);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_last_login ON users(last_login_at);

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL, -- Higher = more privileged
    is_privileged BOOLEAN NOT NULL DEFAULT false, -- Requires MFA
    permissions JSONB NOT NULL DEFAULT '[]', -- Array of permissions
    department_scoped BOOLEAN NOT NULL DEFAULT false, -- If true, only works within user's department
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert standard government roles
INSERT INTO roles (name, display_name, description, level, is_privileged, permissions, department_scoped) VALUES
('super_admin', 'Super Administrator', 'Full system access across all departments', 100, true, 
 '["*"]', false),
('org_admin', 'Organization Administrator', 'Manage organization settings and cross-department operations', 90, true,
 '["users:manage", "departments:manage", "assets:view_all", "audit:view", "reports:generate"]', false),
('macs_head', 'MAC Head', 'Lead a Ministry, Agency, or Commission', 80, true,
 '["department:manage", "users:manage_department", "assets:manage_department", "budget:manage", "reports:department"]', true),
('department_manager', 'Department Manager', 'Manage department operations and assets', 70, false,
 '["assets:manage_department", "users:view_department", "facilities:manage_department"]', true),
('auditor', 'Auditor', 'Read-only access for compliance and audit purposes', 60, true,
 '["audit:view", "assets:view_all", "users:view_all", "reports:audit"]', false),
('fleet_manager', 'Fleet Manager', 'Manage vehicles and transportation assets', 50, false,
 '["vehicles:manage_department", "maintenance:manage", "gps:view"]', true),
('asset_manager', 'Asset Manager', 'Manage equipment and furniture assets', 50, false,
 '["equipment:manage_department", "furniture:manage_department", "maintenance:manage"]', true),
('standard_user', 'Standard User', 'Basic system access for daily operations', 10, false,
 '["assets:view_assigned", "profile:manage"]', true);

-- User roles assignment (many-to-many with audit)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_by UUID NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional role expiration
    justification TEXT, -- Required for privileged roles
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- WebAuthn/FIDO2 credentials
CREATE TABLE webauthn_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id BYTEA UNIQUE NOT NULL, -- WebAuthn credential ID
    public_key BYTEA NOT NULL, -- Public key for verification
    counter BIGINT NOT NULL DEFAULT 0, -- Signature counter for replay protection
    device_type VARCHAR(50), -- 'security_key', 'platform', etc.
    device_name VARCHAR(100), -- User-friendly name
    attestation_type VARCHAR(50), -- 'none', 'basic', 'attca'
    transports TEXT[], -- ['usb', 'nfc', 'ble', 'internal']
    aaguid UUID, -- Authenticator AAGUID
    backup_eligible BOOLEAN DEFAULT false,
    backup_state BOOLEAN DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_ip INET,
    created_by_user_agent TEXT
);

CREATE INDEX idx_webauthn_user_id ON webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_credential_id ON webauthn_credentials(credential_id);

-- TOTP secrets
CREATE TABLE totp_secrets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    secret_encrypted BYTEA NOT NULL, -- Encrypted TOTP secret
    algorithm VARCHAR(10) NOT NULL DEFAULT 'SHA1',
    digits INTEGER NOT NULL DEFAULT 6,
    period INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true,
    backup_codes_encrypted BYTEA, -- Encrypted backup codes
    backup_codes_used INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_totp_user_id ON totp_secrets(user_id);

-- Sessions and refresh tokens
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT UNIQUE NOT NULL, -- Hashed refresh token
    access_token_jti VARCHAR(36) UNIQUE, -- JWT ID for access token
    device_fingerprint TEXT, -- Browser/device fingerprint
    ip_address INET NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Audit log (immutable)
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'mfa_verify', 'role_change', etc.
    actor_id UUID REFERENCES users(id), -- Who performed the action
    target_user_id UUID REFERENCES users(id), -- Target of the action (if applicable)
    resource_type VARCHAR(50), -- 'user', 'role', 'asset', etc.
    resource_id VARCHAR(100), -- ID of the resource
    action VARCHAR(100) NOT NULL, -- Specific action taken
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success', 'failure', 'partial')),
    
    -- Request context
    ip_address INET NOT NULL,
    user_agent TEXT,
    session_id UUID,
    
    -- Additional context
    metadata JSONB DEFAULT '{}', -- Flexible additional data
    risk_score INTEGER DEFAULT 0, -- 0-100, for anomaly detection
    
    -- Immutable timestamp
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for audit queries (read-heavy)
CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp);
CREATE INDEX idx_audit_events_actor_id ON audit_events(actor_id);
CREATE INDEX idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_outcome ON audit_events(outcome);
CREATE INDEX idx_audit_events_resource ON audit_events(resource_type, resource_id);

-- Password policy violations log
CREATE TABLE password_policy_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    violation_type VARCHAR(50) NOT NULL, -- 'weak_password', 'breached_password', 'reused_password'
    attempted_password_hash TEXT, -- For breach checking (one-way hash only)
    ip_address INET NOT NULL,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting table
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL, -- IP, user_id, email, etc.
    action VARCHAR(50) NOT NULL, -- 'login', 'password_reset', 'mfa_verify'
    attempts INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(identifier, action)
);

CREATE INDEX idx_rate_limits_identifier_action ON rate_limits(identifier, action);

-- Security events for monitoring
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL, -- 'suspicious_login', 'impossible_travel', 'brute_force'
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_security_events_created_at ON security_events(created_at);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_resolved ON security_events(resolved);

-- Account recovery requests
CREATE TABLE account_recovery_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recovery_token_hash TEXT UNIQUE NOT NULL,
    recovery_method VARCHAR(50) NOT NULL, -- 'email', 'manual_verification', 'document_upload'
    verification_data JSONB, -- Uploaded documents, answers, etc. (encrypted)
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired', 'used')),
    
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(id),
    ip_address INET NOT NULL,
    user_agent TEXT
);

-- Departments table (if not exists)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ministry', 'agency', 'commission', 'bureau', 'authority')),
    head_of_department VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    budget DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'restructuring')),
    established_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) for department scoping
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own data unless they have cross-department permissions
CREATE POLICY users_own_data ON users
    FOR ALL
    TO authenticated_users
    USING (id = current_user_id() OR has_permission(current_user_id(), 'users:view_all'));

-- Department scoped access for MAC Heads
CREATE POLICY users_department_access ON users
    FOR ALL
    TO authenticated_users
    USING (
        department_id = current_user_department_id() 
        AND has_permission(current_user_id(), 'users:manage_department')
    );

-- Functions for RLS
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
    SELECT COALESCE(current_setting('app.current_user_id', true)::UUID, NULL);
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION current_user_department_id() RETURNS UUID AS $$
    SELECT department_id FROM users WHERE id = current_user_id();
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, permission_name TEXT) RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_uuid 
        AND ur.is_active = true
        AND (
            r.permissions ? permission_name 
            OR r.permissions ? '*'
            OR r.permissions ? split_part(permission_name, ':', 1) || ':*'
        )
    );
$$ LANGUAGE SQL STABLE;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_events (event_type, actor_id, target_user_id, resource_type, resource_id, action, outcome, metadata)
        VALUES ('user_created', current_user_id(), NEW.id, 'user', NEW.id::TEXT, 'create', 'success', 
                jsonb_build_object('username', NEW.username, 'department_id', NEW.department_id));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log significant changes
        IF OLD.password_hash != NEW.password_hash THEN
            INSERT INTO audit_events (event_type, actor_id, target_user_id, resource_type, resource_id, action, outcome, metadata)
            VALUES ('password_changed', current_user_id(), NEW.id, 'user', NEW.id::TEXT, 'password_change', 'success', '{}');
        END IF;
        
        IF OLD.is_active != NEW.is_active THEN
            INSERT INTO audit_events (event_type, actor_id, target_user_id, resource_type, resource_id, action, outcome, metadata)
            VALUES ('user_status_changed', current_user_id(), NEW.id, 'user', NEW.id::TEXT, 
                   CASE WHEN NEW.is_active THEN 'activate' ELSE 'deactivate' END, 'success',
                   jsonb_build_object('old_status', OLD.is_active, 'new_status', NEW.is_active));
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_events (event_type, actor_id, target_user_id, resource_type, resource_id, action, outcome, metadata)
        VALUES ('user_deleted', current_user_id(), OLD.id, 'user', OLD.id::TEXT, 'delete', 'success',
                jsonb_build_object('username', OLD.username));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER audit_user_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_user_changes();

-- Create authenticated_users role for RLS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated_users') THEN
        CREATE ROLE authenticated_users;
    END IF;
END
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated_users;
GRANT SELECT ON roles TO authenticated_users;
GRANT SELECT, INSERT, UPDATE ON user_roles TO authenticated_users;
GRANT INSERT ON audit_events TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON webauthn_credentials TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON totp_secrets TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated_users;

-- Security views for safe data access
CREATE VIEW user_profiles AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.badge_number,
    u.is_active,
    u.last_login_at,
    u.department_id,
    u.clearance_level,
    d.name as department_name,
    d.code as department_code,
    array_agg(r.name) as role_names,
    array_agg(r.display_name) as role_display_names
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.username, u.email, u.full_name, u.badge_number, u.is_active, 
         u.last_login_at, u.department_id, u.clearance_level, d.name, d.code;

-- Security constraints
ALTER TABLE users ADD CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE users ADD CONSTRAINT username_format CHECK (username ~* '^[a-zA-Z0-9._-]{3,50}$');
ALTER TABLE users ADD CONSTRAINT badge_number_format CHECK (badge_number ~* '^[A-Z]{2,5}-[0-9]{3,6}$');

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts with government-grade security';
COMMENT ON COLUMN users.password_hash IS 'Argon2id hash with salt';
COMMENT ON COLUMN users.clearance_level IS 'Security clearance for access control';
COMMENT ON TABLE audit_events IS 'Immutable audit log for compliance';
COMMENT ON TABLE webauthn_credentials IS 'FIDO2/WebAuthn security keys and platform authenticators';
COMMENT ON TABLE totp_secrets IS 'Time-based one-time password secrets (encrypted)';
