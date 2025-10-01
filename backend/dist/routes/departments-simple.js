"use strict";
/**
 * Simple Departments/MACs API Routes
 * Working version without database dependencies
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Mock departments data (replace with database later)
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
        employeeCount: 0,
        vehicleCount: 0,
        facilityCount: 0,
        equipmentCount: 0,
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
        employeeCount: 0,
        vehicleCount: 0,
        facilityCount: 0,
        equipmentCount: 0,
        establishedDate: '1847-07-26'
    }
];
// GET /api/departments - List all departments
router.get('/', (_req, res) => {
    console.log('📊 Fetching departments data');
    res.json({
        success: true,
        departments: departments,
        total: departments.length,
        message: `Retrieved ${departments.length} departments`
    });
    console.log(`✅ Retrieved ${departments.length} departments`);
});
// POST /api/departments - Create new department
router.post('/', async (req, res) => {
    try {
        const { name, code, type, headOfDepartment, email, phone, address, budget, establishedDate } = req.body;
        console.log('💾 Creating new department:', { name, code, type });
        // Validation
        if (!name || !code || !type) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: name, code, type'
            });
        }
        // Check for duplicate code
        if (departments.find(d => d.code === code.toUpperCase())) {
            return res.status(409).json({
                success: false,
                message: 'Department code already exists'
            });
        }
        const newDepartment = {
            id: `DEPT${Date.now()}`,
            name,
            code: code.toUpperCase(),
            type,
            headOfDepartment: headOfDepartment || '',
            email: email || '',
            phone: phone || '',
            address: address || '',
            budget: budget || 0,
            status: 'active',
            employeeCount: 0,
            vehicleCount: 0,
            facilityCount: 0,
            equipmentCount: 0,
            establishedDate: establishedDate || new Date().toISOString().split('T')[0]
        };
        departments.push(newDepartment);
        res.status(201).json({
            success: true,
            department: newDepartment,
            message: `Department ${name} created successfully`
        });
        console.log(`✅ Created department: ${name} (${code})`);
    }
    catch (error) {
        console.error('❌ Error creating department:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while creating department'
        });
    }
});
// PUT /api/departments/:id - Update department
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        console.log('💾 Updating department:', id);
        const departmentIndex = departments.findIndex(d => d.id === id);
        if (departmentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }
        // Update department while preserving asset counts
        const currentDepartment = departments[departmentIndex];
        const updatedDepartment = {
            ...currentDepartment,
            ...updateData,
            // Preserve asset counts
            employeeCount: currentDepartment.employeeCount,
            vehicleCount: currentDepartment.vehicleCount,
            facilityCount: currentDepartment.facilityCount,
            equipmentCount: currentDepartment.equipmentCount
        };
        departments[departmentIndex] = updatedDepartment;
        res.json({
            success: true,
            department: updatedDepartment,
            message: `Department ${updatedDepartment.name} updated successfully`
        });
        console.log(`✅ Updated department: ${updatedDepartment.name}`);
    }
    catch (error) {
        console.error('❌ Error updating department:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating department'
        });
    }
});
// DELETE /api/departments/:id - Delete department
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting department:', id);
        const departmentIndex = departments.findIndex(d => d.id === id);
        if (departmentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }
        const department = departments[departmentIndex];
        departments.splice(departmentIndex, 1);
        res.json({
            success: true,
            message: `Department ${department.name} deleted successfully`
        });
        console.log(`✅ Deleted department: ${department.name}`);
    }
    catch (error) {
        console.error('❌ Error deleting department:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while deleting department'
        });
    }
});
exports.default = router;
//# sourceMappingURL=departments-simple.js.map