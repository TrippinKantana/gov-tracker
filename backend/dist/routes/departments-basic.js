"use strict";
/**
 * Basic Departments API - No Database Dependencies
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Simple in-memory departments
let departments = [
    {
        id: 'DEPT001',
        name: 'Ministry of Health',
        code: 'MOH',
        type: 'ministry',
        headOfDepartment: 'Dr. Sarah Johnson',
        email: 'info@health.gov.lr',
        phone: '+231-555-0101',
        address: 'Capitol Hill, Monrovia',
        budget: 25000000,
        status: 'active',
        employeeCount: 45,
        vehicleCount: 12,
        facilityCount: 8,
        equipmentCount: 89,
        establishedDate: '1847-07-26'
    },
    {
        id: 'DEPT002',
        name: 'Ministry of Agriculture',
        code: 'MOA',
        type: 'ministry',
        headOfDepartment: 'Prof. Michael Davis',
        email: 'info@agriculture.gov.lr',
        phone: '+231-555-0102',
        address: 'Sinkor, Monrovia',
        budget: 18000000,
        status: 'active',
        employeeCount: 38,
        vehicleCount: 15,
        facilityCount: 12,
        equipmentCount: 67,
        establishedDate: '1847-07-26'
    }
];
// GET /api/departments
router.get('/', (_req, res) => {
    res.json({
        success: true,
        departments: departments,
        total: departments.length
    });
});
// POST /api/departments
router.post('/', (req, res) => {
    const newDepartment = {
        id: `DEPT${Date.now()}`,
        ...req.body,
        employeeCount: 0,
        vehicleCount: 0,
        facilityCount: 0,
        equipmentCount: 0
    };
    departments.push(newDepartment);
    res.status(201).json({ success: true, department: newDepartment });
});
// PUT /api/departments/:id
router.put('/:id', (req, res) => {
    const index = departments.findIndex(d => d.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Department not found' });
    }
    departments[index] = { ...departments[index], ...req.body };
    return res.json({ success: true, department: departments[index] });
});
// DELETE /api/departments/:id
router.delete('/:id', (req, res) => {
    const index = departments.findIndex(d => d.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Department not found' });
    }
    departments.splice(index, 1);
    return res.json({ success: true, message: 'Department deleted' });
});
exports.default = router;
//# sourceMappingURL=departments-basic.js.map