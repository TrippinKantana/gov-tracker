"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const assets_1 = __importDefault(require("./routes/assets"));
const tracking_1 = __importDefault(require("./routes/tracking"));
const hardware_1 = __importDefault(require("./routes/hardware"));
const equipment_1 = __importDefault(require("./routes/equipment"));
const departments_1 = __importDefault(require("./routes/departments"));
const facilities_1 = __importDefault(require("./routes/facilities"));
const employees_1 = __importDefault(require("./routes/employees"));
const vehicles_1 = __importDefault(require("./routes/vehicles"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const search_1 = __importDefault(require("./routes/search"));
// import personnelRoutes from './routes/personnel';
// import gpsDeviceRoutes from './routes/gps-devices';
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
// app.use('/api/personnel', personnelRoutes);
app.use('/api/departments', departments_1.default);
// app.use('/api/gps-devices', gpsDeviceRoutes);
app.use('/api/assets', assets_1.default);
app.use('/api/tracking', tracking_1.default);
app.use('/api/hardware', hardware_1.default);
app.use('/api/equipment', equipment_1.default);
app.use('/api/facilities', facilities_1.default);
app.use('/api/employees', employees_1.default);
app.use('/api/vehicles', vehicles_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/search', search_1.default);
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
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map