"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// Validation middleware
const handleValidation = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    return next();
};
// Mock equipment data (replace with database in production)
let mockEquipment = [
    {
        id: 'EQ001',
        name: 'Dell Latitude 7420',
        type: 'laptop',
        brand: 'Dell',
        model: 'Latitude 7420',
        serialNumber: 'DL7420-001',
        department: 'Ministry of Health',
        assignedTo: 'Dr. Sarah Johnson',
        assignedEmployee: {
            id: 'EMP001',
            name: 'Dr. Sarah Johnson',
            badgeNumber: 'GSA-001'
        },
        facility: {
            id: 'FC001',
            name: 'Ministry of Health HQ',
            room: 'Room 201'
        },
        status: 'active',
        condition: 'excellent',
        purchaseDate: '2023-03-15',
        purchasePrice: 1200.00,
        warrantyExpiry: '2026-03-15',
        lastMaintenance: '2024-01-10',
        location: 'Health Ministry - Room 201',
        notes: 'Primary laptop for health director',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'EQ002',
        name: 'HP LaserJet Pro M404',
        type: 'printer',
        brand: 'HP',
        model: 'LaserJet Pro M404',
        serialNumber: 'HP404-002',
        department: 'General Services Agency',
        status: 'available',
        condition: 'good',
        purchaseDate: '2022-08-20',
        purchasePrice: 350.00,
        warrantyExpiry: '2024-08-20',
        lastMaintenance: '2024-01-05',
        location: 'GSA Central Office',
        notes: 'Shared printer for administrative tasks',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];
// GET /api/equipment - Get all equipment with filtering
router.get('/', [
    (0, express_validator_1.query)('search').optional().isString(),
    (0, express_validator_1.query)('type').optional().isIn(['laptop', 'desktop', 'tablet', 'phone', 'printer', 'projector', 'server', 'radio', 'camera']),
    (0, express_validator_1.query)('status').optional().isIn(['active', 'available', 'maintenance', 'retired', 'lost']),
    (0, express_validator_1.query)('department').optional().isString(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 1000 }),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }),
    handleValidation
], async (req, res) => {
    try {
        const { search, type, status, department, limit = 100, offset = 0 } = req.query;
        let filteredEquipment = [...mockEquipment];
        // Apply filters
        if (search) {
            const searchTerm = search.toString().toLowerCase();
            filteredEquipment = filteredEquipment.filter(eq => eq.name.toLowerCase().includes(searchTerm) ||
                eq.serialNumber.toLowerCase().includes(searchTerm) ||
                eq.brand.toLowerCase().includes(searchTerm) ||
                eq.department.toLowerCase().includes(searchTerm) ||
                (eq.assignedTo && eq.assignedTo.toLowerCase().includes(searchTerm)));
        }
        if (type) {
            filteredEquipment = filteredEquipment.filter(eq => eq.type === type);
        }
        if (status) {
            filteredEquipment = filteredEquipment.filter(eq => eq.status === status);
        }
        if (department) {
            filteredEquipment = filteredEquipment.filter(eq => eq.department === department);
        }
        // Apply pagination
        const total = filteredEquipment.length;
        const paginatedEquipment = filteredEquipment.slice(Number(offset), Number(offset) + Number(limit));
        return res.json({
            success: true,
            equipment: paginatedEquipment,
            total,
            offset: Number(offset),
            limit: Number(limit)
        });
    }
    catch (error) {
        console.error('Error fetching equipment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/equipment/:id - Get single equipment
router.get('/:id', [
    (0, express_validator_1.param)('id').notEmpty(),
    handleValidation
], async (req, res) => {
    try {
        const { id } = req.params;
        const equipment = mockEquipment.find(eq => eq.id === id);
        if (!equipment) {
            return res.status(404).json({ error: 'Equipment not found' });
        }
        return res.json({
            success: true,
            equipment
        });
    }
    catch (error) {
        console.error('Error fetching equipment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/equipment - Create new equipment
router.post('/', [
    (0, express_validator_1.body)('name').notEmpty().isLength({ min: 1, max: 255 }),
    (0, express_validator_1.body)('type').isIn(['laptop', 'desktop', 'tablet', 'phone', 'printer', 'projector', 'server', 'radio', 'camera']),
    (0, express_validator_1.body)('brand').notEmpty().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('model').notEmpty().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('serialNumber').notEmpty().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('department').notEmpty().isLength({ min: 1, max: 255 }),
    (0, express_validator_1.body)('status').isIn(['active', 'available', 'maintenance', 'retired', 'lost']),
    (0, express_validator_1.body)('condition').isIn(['excellent', 'good', 'fair', 'poor']),
    (0, express_validator_1.body)('purchaseDate').isISO8601(),
    (0, express_validator_1.body)('purchasePrice').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('warrantyExpiry').optional().isISO8601(),
    (0, express_validator_1.body)('location').notEmpty().isLength({ min: 1, max: 255 }),
    (0, express_validator_1.body)('notes').optional().isLength({ max: 1000 }),
    handleValidation
], async (req, res) => {
    try {
        const equipmentData = req.body;
        const newEquipment = {
            id: `EQ${String(mockEquipment.length + 1).padStart(3, '0')}`,
            ...equipmentData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        mockEquipment.push(newEquipment);
        console.log('Created new equipment:', newEquipment);
        return res.status(201).json({
            success: true,
            equipment: newEquipment,
            message: 'Equipment created successfully'
        });
    }
    catch (error) {
        console.error('Error creating equipment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/equipment/:id - Update equipment
router.put('/:id', [
    (0, express_validator_1.param)('id').notEmpty(),
    (0, express_validator_1.body)('name').optional().isLength({ min: 1, max: 255 }),
    (0, express_validator_1.body)('type').optional().isIn(['laptop', 'desktop', 'tablet', 'phone', 'printer', 'projector', 'server', 'radio', 'camera']),
    (0, express_validator_1.body)('brand').optional().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('model').optional().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('serialNumber').optional().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('department').optional().isLength({ min: 1, max: 255 }),
    (0, express_validator_1.body)('status').optional().isIn(['active', 'available', 'maintenance', 'retired', 'lost']),
    (0, express_validator_1.body)('condition').optional().isIn(['excellent', 'good', 'fair', 'poor']),
    (0, express_validator_1.body)('location').optional().isLength({ min: 1, max: 255 }),
    (0, express_validator_1.body)('notes').optional().isLength({ max: 1000 }),
    handleValidation
], async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const equipmentIndex = mockEquipment.findIndex(eq => eq.id === id);
        if (equipmentIndex === -1) {
            return res.status(404).json({ error: 'Equipment not found' });
        }
        mockEquipment[equipmentIndex] = {
            ...mockEquipment[equipmentIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        console.log('Updated equipment:', mockEquipment[equipmentIndex]);
        return res.json({
            success: true,
            equipment: mockEquipment[equipmentIndex],
            message: 'Equipment updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating equipment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/equipment/:id - Delete equipment
router.delete('/:id', [
    (0, express_validator_1.param)('id').notEmpty(),
    handleValidation
], async (req, res) => {
    try {
        const { id } = req.params;
        const equipmentIndex = mockEquipment.findIndex(eq => eq.id === id);
        if (equipmentIndex === -1) {
            return res.status(404).json({ error: 'Equipment not found' });
        }
        const deletedEquipment = mockEquipment.splice(equipmentIndex, 1)[0];
        console.log('Deleted equipment:', deletedEquipment);
        return res.json({
            success: true,
            message: 'Equipment deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting equipment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/equipment/:id/history - Get equipment history
router.get('/:id/history', [
    (0, express_validator_1.param)('id').notEmpty(),
    handleValidation
], async (req, res) => {
    try {
        const { id } = req.params;
        const equipment = mockEquipment.find(eq => eq.id === id);
        if (!equipment) {
            return res.status(404).json({ error: 'Equipment not found' });
        }
        // Mock history data
        const history = [
            {
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                action: 'assigned',
                details: 'Assigned to Dr. Sarah Johnson',
                performedBy: 'IT Admin'
            },
            {
                timestamp: new Date(Date.now() - 172800000).toISOString(),
                action: 'maintenance',
                details: 'Routine maintenance completed',
                performedBy: 'Tech Support'
            }
        ];
        return res.json({
            success: true,
            equipmentId: id,
            history
        });
    }
    catch (error) {
        console.error('Error fetching equipment history:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=equipment.js.map