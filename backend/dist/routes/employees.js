"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = express_1.default.Router();
// Validation middleware
const handleValidation = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    return next();
};
// Mock employee data (replace with database in production)
let mockEmployees = [
    {
        id: 'EMP001',
        username: 'sarah.johnson',
        firstName: 'Sarah',
        lastName: 'Johnson',
        fullName: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@health.gov.lr',
        role: 'official',
        department: 'Ministry of Health',
        departmentId: 'DEPT001',
        badgeNumber: 'GSA-001',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'EMP002',
        username: 'john.doe',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        email: 'john.doe@agriculture.gov.lr',
        role: 'operator',
        department: 'Ministry of Agriculture',
        departmentId: 'DEPT002',
        badgeNumber: 'GSA-002',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];
// GET /api/employees - Get all employees with filtering
router.get('/', [
    (0, express_validator_1.query)('search').optional().isString(),
    (0, express_validator_1.query)('role').optional().isIn(['admin', 'official', 'operator', 'viewer']),
    (0, express_validator_1.query)('department').optional().isString(),
    (0, express_validator_1.query)('status').optional().isIn(['active', 'inactive']),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 1000 }),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }),
    handleValidation
], async (req, res) => {
    try {
        const { search, role, department, status, limit = 100, offset = 0 } = req.query;
        let filteredEmployees = [...mockEmployees];
        // Apply filters
        if (search) {
            const searchTerm = search.toString().toLowerCase();
            filteredEmployees = filteredEmployees.filter(emp => emp.fullName.toLowerCase().includes(searchTerm) ||
                emp.username.toLowerCase().includes(searchTerm) ||
                emp.email.toLowerCase().includes(searchTerm) ||
                emp.badgeNumber.toLowerCase().includes(searchTerm) ||
                emp.department.toLowerCase().includes(searchTerm));
        }
        if (role) {
            filteredEmployees = filteredEmployees.filter(emp => emp.role === role);
        }
        if (department) {
            filteredEmployees = filteredEmployees.filter(emp => emp.department === department);
        }
        if (status) {
            const isActive = status === 'active';
            filteredEmployees = filteredEmployees.filter(emp => emp.isActive === isActive);
        }
        // Apply pagination
        const total = filteredEmployees.length;
        const paginatedEmployees = filteredEmployees.slice(Number(offset), Number(offset) + Number(limit));
        return res.json({
            success: true,
            employees: paginatedEmployees,
            total,
            offset: Number(offset),
            limit: Number(limit)
        });
    }
    catch (error) {
        console.error('Error fetching employees:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/employees/:id - Get single employee
router.get('/:id', [
    (0, express_validator_1.param)('id').notEmpty(),
    handleValidation
], async (req, res) => {
    try {
        const { id } = req.params;
        const employee = mockEmployees.find(emp => emp.id === id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        return res.json({
            success: true,
            employee
        });
    }
    catch (error) {
        console.error('Error fetching employee:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/employees - Create new employee
router.post('/', [
    (0, express_validator_1.body)('firstName').notEmpty().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('lastName').notEmpty().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('username').notEmpty().isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_.]+$/),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6, max: 100 }),
    (0, express_validator_1.body)('role').isIn(['admin', 'official', 'operator', 'viewer']),
    (0, express_validator_1.body)('department').notEmpty().isLength({ min: 1, max: 255 }),
    (0, express_validator_1.body)('departmentId').notEmpty(),
    (0, express_validator_1.body)('badgeNumber').notEmpty().isLength({ min: 3, max: 20 }),
    (0, express_validator_1.body)('fullName').notEmpty().isLength({ min: 1, max: 255 }),
    handleValidation
], async (req, res) => {
    try {
        const employeeData = req.body;
        // Check if username already exists
        const existingUsername = mockEmployees.find(emp => emp.username === employeeData.username);
        if (existingUsername) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        // Check if email already exists
        const existingEmail = mockEmployees.find(emp => emp.email === employeeData.email);
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        // Check if badge number already exists
        const existingBadge = mockEmployees.find(emp => emp.badgeNumber === employeeData.badgeNumber);
        if (existingBadge) {
            return res.status(400).json({ error: 'Badge number already exists' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(employeeData.password, 10);
        const newEmployee = {
            id: `EMP${String(mockEmployees.length + 1).padStart(3, '0')}`,
            ...employeeData,
            passwordHash: hashedPassword,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        // Remove plain password from response
        delete newEmployee.password;
        mockEmployees.push(newEmployee);
        console.log('Created new employee:', newEmployee);
        return res.status(201).json({
            success: true,
            employee: newEmployee,
            message: 'Employee created successfully'
        });
    }
    catch (error) {
        console.error('Error creating employee:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/employees/:id - Update employee
router.put('/:id', [
    (0, express_validator_1.param)('id').notEmpty(),
    (0, express_validator_1.body)('firstName').optional().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('lastName').optional().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('email').optional().isEmail().normalizeEmail(),
    (0, express_validator_1.body)('role').optional().isIn(['admin', 'official', 'operator', 'viewer']),
    (0, express_validator_1.body)('department').optional().isLength({ min: 1, max: 255 }),
    (0, express_validator_1.body)('isActive').optional().isBoolean(),
    handleValidation
], async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const employeeIndex = mockEmployees.findIndex(emp => emp.id === id);
        if (employeeIndex === -1) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        mockEmployees[employeeIndex] = {
            ...mockEmployees[employeeIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        console.log('Updated employee:', mockEmployees[employeeIndex]);
        return res.json({
            success: true,
            employee: mockEmployees[employeeIndex],
            message: 'Employee updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating employee:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/employees/:id - Delete employee
router.delete('/:id', [
    (0, express_validator_1.param)('id').notEmpty(),
    handleValidation
], async (req, res) => {
    try {
        const { id } = req.params;
        const employeeIndex = mockEmployees.findIndex(emp => emp.id === id);
        if (employeeIndex === -1) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        const deletedEmployee = mockEmployees.splice(employeeIndex, 1)[0];
        console.log('Deleted employee:', deletedEmployee);
        return res.json({
            success: true,
            message: 'Employee deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting employee:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=employees.js.map