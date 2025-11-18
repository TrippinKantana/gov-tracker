# Government Asset Tracking & Security Platform

**Partnership: Lantern Cybersecurity & General Services Agency (GSA), Liberia**

A comprehensive asset management and tracking system for government resources including vehicles, facilities, IT devices, and equipment. Features real-time GPS tracking with Lantern SOS Tracker integration, role-based dashboards, and full-screen interactive maps.

## 🚀 Quick Start

```bash
# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install

# Set up environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database and API keys

# Start development servers
npm run dev
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript  
- **Database**: PostgreSQL + PostGIS (geospatial)
- **Real-time**: Socket.IO for live GPS updates
- **Maps**: Mapbox GL JS with full-screen capability
- **Hardware**: Lantern SOS Tracker integration
- **Security**: Strix AI-powered penetration testing (automated in CI/CD)

## 📁 Project Structure

```
├── frontend/          # React application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Dashboard, MapView, Assets
│   │   ├── types/      # TypeScript interfaces
│   │   └── utils/      # Helper functions
├── backend/           # Express API server
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── models/     # Database models
│   │   └── middleware/ # Auth, validation
├── database/          # PostgreSQL schema & setup
├── hardware/          # Lantern SOS integration
└── docs/             # API documentation
```

## 🎯 Key Features

### Asset Tracking
- **Vehicles**: Cars, motorcycles, trucks, aircraft
- **Facilities**: Ministries, hospitals, schools, bases  
- **IT Equipment**: Laptops, tablets, radios, body cameras
- **Office Equipment**: Furniture, generators, medical devices

### Real-Time Monitoring
- Live GPS tracking with Lantern SOS Tracker
- Vehicle ignition/ACC detection  
- SOS emergency alerts
- Remote engine cut-off capability

### Interactive Maps
- Full-screen Mapbox integration
- Asset clustering and filtering
- Click-to-view asset details
- Real-time location updates

### Role-Based Access
- **High Officials**: Strategic dashboards with KPIs
- **IT Admins**: Technical troubleshooting access  
- **Department Heads**: Staff and asset oversight
- **Operators**: Daily monitoring interface

## 🗺️ Map Features

The full-screen map supports:
- **Asset Layers**: Vehicles, facilities, devices
- **Filters**: By type, department, status, region
- **Search**: Asset ID, license plate, facility name
- **Real-time Updates**: WebSocket/MQTT GPS feeds
- **Clustering**: Performance optimization for large datasets

## 🛡️ Security

- JWT authentication with role-based permissions
- Secure API endpoints with proper validation
- Database encryption for sensitive data
- Real-time alerts for unauthorized asset movement
- **Automated Security Testing**: Strix AI-powered penetration testing runs on every PR
  - See [Security Testing Guide](docs/STRIX_SECURITY_TESTING.md) for details

## 🔧 Development

### Commands
- `npm run dev` - Start frontend & backend
- `npm run build` - Build for production  
- `npm run test` - Run all tests
- `npm run lint` - Check code style
- `npm run type-check` - TypeScript validation

### Environment Variables
See `backend/.env.example` for required configuration including:
- Database connection (PostgreSQL + PostGIS)
- Mapbox access token
- Lantern SOS API credentials  
- JWT secrets

## 📊 Database

PostgreSQL with PostGIS extension for geospatial operations:
- **Assets**: Main registry with GPS coordinates
- **Tracking**: Historical location data with spatial indexing
- **Users**: Role-based authentication
- **Facilities**: Government buildings and infrastructure
- **Maintenance**: Service records and scheduling

See `database/setup.md` for detailed installation instructions.

## 🌍 Deployment

Built for government environments with:
- High availability and disaster recovery
- Audit logging and compliance reporting  
- Integration with existing government systems
- Scalable architecture for nationwide deployment

## 📞 Support

For technical support and deployment assistance:
- **Lantern Cybersecurity**: Hardware and security integration
- **GSA Partnership**: Government compliance and training

---

**Securing Government Assets • Powered by Lantern SOS Technology**
