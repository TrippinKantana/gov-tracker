# Database Setup Guide

## Prerequisites

1. Install PostgreSQL (version 13+)
2. Install PostGIS extension
3. Create database user and database

## Setup Steps

### 1. Create Database and User

```sql
-- Connect as postgres superuser
sudo -u postgres psql

-- Create database and user
CREATE DATABASE gov_asset_tracker;
CREATE USER tracker_user WITH PASSWORD 'secure_password_here';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE gov_asset_tracker TO tracker_user;
ALTER USER tracker_user CREATEDB;

-- Switch to the new database
\c gov_asset_tracker

-- Enable PostGIS extension (requires superuser)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO tracker_user;
GRANT CREATE ON SCHEMA public TO tracker_user;
```

### 2. Run Schema Creation

```bash
# From the database directory
psql -h localhost -U tracker_user -d gov_asset_tracker -f schema.sql
```

### 3. Environment Configuration

Copy the `.env.example` file in the backend directory and update the database connection settings:

```bash
DATABASE_URL=postgresql://tracker_user:secure_password_here@localhost:5432/gov_asset_tracker
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gov_asset_tracker
DB_USER=tracker_user
DB_PASSWORD=secure_password_here
```

### 4. Verify Installation

```sql
-- Connect to database
psql -h localhost -U tracker_user -d gov_asset_tracker

-- Check tables were created
\dt

-- Check PostGIS is working
SELECT PostGIS_Version();

-- Verify sample data
SELECT * FROM users;
SELECT * FROM asset_categories;
```

## Sample Data

The schema includes:
- 6 default asset categories
- 1 admin user (username: admin, password: admin123)

## Database Maintenance

### Backup
```bash
pg_dump -h localhost -U tracker_user gov_asset_tracker > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
psql -h localhost -U tracker_user -d gov_asset_tracker < backup_file.sql
```

## Performance Tuning

The schema includes optimized indexes for:
- GPS location queries (GIST index)
- Asset tracking by time
- User lookups
- Asset searches

For production deployment, consider:
1. Connection pooling (PgBouncer)
2. Read replicas for analytics
3. Partitioning for large tracking tables
4. Regular VACUUM and ANALYZE
