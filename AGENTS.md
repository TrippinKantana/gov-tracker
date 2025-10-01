# Government Asset Tracking & Security Platform - Agent Guidelines

## Build/Test Commands
- Run tests: `npm test` 
- Run single test: `npm test -- --grep "test-name"`
- Build: `npm run build`
- Lint: `npm run lint`
- Type check: `npm run type-check`
- Start dev: `npm run dev`

## Architecture & Structure
- `/frontend` - React app with Mapbox GL JS integration
- `/backend` - Node.js/Express API server  
- `/database` - PostgreSQL + PostGIS for geospatial data
- `/hardware` - Lantern SOS Tracker integration code
- `/docs` - API documentation and deployment guides
- Core features: asset tracking, real-time GPS, role-based dashboards, full-screen maps

## Code Style & Conventions
- Use descriptive names (e.g., `assetLocation`, `vehicleFleet`, `sosTracker`)
- TypeScript for all frontend/backend code
- Import order: React/external libs first, then internal modules
- Handle GPS/tracking data with proper error boundaries
- Use interfaces for asset types, tracker data, user roles
- Secure API endpoints with proper authentication
