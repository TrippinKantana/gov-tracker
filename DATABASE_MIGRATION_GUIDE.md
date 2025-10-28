# Database Migration Guide: Mock Data → Production Database

This guide will help you migrate from mock data to a production PostgreSQL database using Neon.

## 🎯 Goal

Replace all in-memory mock data with a real database so that:
- ✅ Data persists across server restarts
- ✅ Multiple users can access and modify data safely
- ✅ You can scale to production
- ✅ Data is backed up automatically

## 📋 Step 1: Set Up Neon Database (5 minutes)

### Option A: Neon Dashboard (Recommended)

1. **Go to** [https://neon.com](https://neon.com)
2. **Sign up** for a free account
3. **Create a new project:**
   - Click "Create project"
   - Name it: `gov-tracker`
   - Choose a region close to your VM (e.g., Europe if your VM is in Europe)
4. **Copy your connection string:**
   - It looks like: `postgresql://username:password@host/database?sslmode=require`
   - Keep this secure - you'll need it!

### Option B: Command Line

```bash
# Install Neon CLI
npm install -g neonctl

# Login
neonctl auth

# Create project
neonctl projects create --name gov-tracker

# Get connection string
neonctl connection-string --project-id YOUR_PROJECT_ID
```

## 📋 Step 2: Create Database Schema (2 minutes)

**On your VM**, run:

```bash
cd ~/gov-tracker
git pull

# Install psql if not already installed
sudo apt-get install postgresql-client -y

# Run the schema creation script
psql "YOUR_CONNECTION_STRING" -f database/production-schema.sql
```

Replace `YOUR_CONNECTION_STRING` with the connection string from Step 1.

## 📋 Step 3: Configure Backend (2 minutes)

**On your VM:**

```bash
cd ~/gov-tracker/backend

# Create .env file with database URL
echo "DATABASE_URL=YOUR_CONNECTION_STRING" > .env

# Install pg driver for Node.js
npm install pg

# Restart backend
pm2 restart gsa-tracker
```

## 📋 Step 4: Verify Database Connection

**On your VM:**

```bash
# Check backend logs
pm2 logs gsa-tracker --lines 20

# You should see:
# ✅ Database connected successfully
```

## 🎉 What Changed?

### Before (Mock Data):
```javascript
// In-memory array - loses data on restart
let vehicles = [ {...} ];
```

### After (Database):
```javascript
// Real database query
const result = await query('SELECT * FROM vehicles WHERE status = $1', ['active']);
```

## 📊 Data Structure

Your database now has these tables:

### Core Tables:
- `departments` - Ministries, Agencies, Commissions (MACs)
- `vehicles` - Government fleet
- `facilities` - Government buildings  
- `equipment` - IT equipment, office items
- `employees` - Personnel records
- `stock_inventory` - Warehouse inventory

### Supporting Tables:
- `vehicle_maintenance` - Vehicle maintenance records
- `facility_maintenance` - Facility maintenance
- `gps_devices` - GPS tracker devices
- `goods_releases` - Stock releases
- `notifications` - System notifications
- `activity_log` - Audit trail

## 🔄 Migration Process

### Phase 1: Setup (Done above)
- ✅ Neon database created
- ✅ Schema deployed
- ✅ Backend connected

### Phase 2: Backend Migration (Next)
Update API endpoints to use database instead of mock arrays:

**Update `backend/server.js`:**
- Replace `let vehicles = [...]` with database queries
- Update all CRUD operations to use `query()` function
- Test each endpoint

### Phase 3: Seed Initial Data (After migration)
```bash
# Option A: Import from CSV
psql "CONNECTION_STRING" -c "\COPY vehicles FROM 'vehicles.csv' WITH CSV HEADER;"

# Option B: Use admin panel to add data
# Once backend is live, use the web UI to add initial records
```

## 🚀 Next Steps

1. **Wait for backend migration** (I'll create this next)
2. **Test all endpoints** with real database
3. **Add initial data** via admin panel or CSV import
4. **Remove all mock files** once confirmed working

## 💰 Neon Pricing

**Free Tier** (Perfect for testing):
- 0.5 GB storage
- Unlimited projects
- Auto pause after inactivity
- Great for testing

**Production** ($19/month):
- 10 GB storage
- Unlimited API calls
- Never sleeps
- Daily backups

## 🔒 Security Notes

- ✅ Neon uses SSL encryption by default
- ✅ Your `.env` file should be in `.gitignore` (already done)
- ✅ Connection strings contain credentials - keep them secret!
- ✅ Use environment variables, never commit credentials

## ❓ Troubleshooting

### "Database not connected" error
```bash
# Check your .env file has DATABASE_URL
cat ~/gov-tracker/backend/.env

# Restart backend
pm2 restart gsa-tracker
```

### "Table doesn't exist" error
```bash
# Re-run schema
psql "YOUR_CONNECTION_STRING" -f database/production-schema.sql
```

### Connection timeout
- Check your VM's firewall allows outbound SSL (port 5432)
- Verify connection string is correct
- Try connecting from another location to test

---

## 📝 Summary

1. ✅ **Setup:** Get Neon account & connection string
2. ✅ **Schema:** Run production-schema.sql
3. ✅ **Connect:** Add DATABASE_URL to .env
4. ✅ **Test:** Verify connection in logs
5. ⏳ **Wait:** Backend migration (coming next)
6. ⏳ **Migrate:** API endpoints use database
7. ⏳ **Deploy:** Remove all mock data

**You're ready for production!** 🎉

