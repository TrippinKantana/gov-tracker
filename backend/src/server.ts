import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Only import routes that are currently working
import departmentRoutes from './routes/departments';
import facilityRoutes from './routes/facilities';
import employeeRoutes from './routes/employees';
import vehicleRoutes from './routes/vehicles';
import equipmentRoutes from './routes/equipment';

// Temporarily disabled until Auth0 issues are resolved:
// import assetRoutes from './routes/assets';
// import trackingRoutes from './routes/tracking';
// import hardwareRoutes from './routes/hardware';
// import notificationRoutes from './routes/notifications';
// import searchRoutes from './routes/search';

// Temporarily disabled problematic routes with Auth0 conflicts:
// import personnelRoutes from './routes/personnel';
// import gpsDeviceRoutes from './routes/gps-devices';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes

// Only enable routes that don't have Auth0 compilation issues:
app.use('/api/departments', departmentRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/employees', employeeRoutes);

// Temporarily disabled until Auth0 type conflicts are resolved:
// app.use('/api/personnel', personnelRoutes);
// app.use('/api/gps-devices', gpsDeviceRoutes);
// app.use('/api/assets', assetRoutes);
// app.use('/api/tracking', trackingRoutes);
// app.use('/api/hardware', hardwareRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/search', searchRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO for real-time GPS updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-tracking', (assetId) => {
    socket.join(`asset-${assetId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
