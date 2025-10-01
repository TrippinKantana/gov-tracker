/**
 * Departments/MACs API Routes
 * Manage Ministries, Agencies, and Commissions
 */

import express, { Request, Response } from 'express';

const router = express.Router();

// In-memory departments storage (revert to simple approach)
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
  },
  {
    id: 'DEPT003',
    name: 'General Services Agency',
    code: 'GSA',
    type: 'agency',
    headOfDepartment: 'Robert Wilson',
    email: 'info@gsa.gov.lr',
    phone: '+231-555-0103',
    address: 'Old Road, Monrovia',
    budget: 15000000,
    status: 'active',
    employeeCount: 52,
    vehicleCount: 18,
    facilityCount: 10,
    equipmentCount: 145,
    establishedDate: '1847-07-26'
  },
  {
    id: 'DEPT004',
    name: 'Ministry of Defense',
    code: 'MOD',
    type: 'ministry',
    headOfDepartment: 'General James Mitchell',
    email: 'info@defense.gov.lr',
    phone: '+231-555-0104',
    address: 'Camp Johnson Road, Monrovia',
    budget: 35000000,
    status: 'active',
    employeeCount: 89,
    vehicleCount: 25,
    facilityCount: 15,
    equipmentCount: 234,
    establishedDate: '1847-07-26'
  },
  {
    id: 'DEPT005',
    name: 'Ministry of Education',
    code: 'MOE',
    type: 'ministry',
    headOfDepartment: 'Prof. Alice Brown',
    email: 'info@education.gov.lr',
    phone: '+231-555-0105',
    address: 'Sinkor, Monrovia',
    budget: 22000000,
    status: 'restructuring',
    employeeCount: 67,
    vehicleCount: 8,
    facilityCount: 45,
    equipmentCount: 123,
    establishedDate: '1847-07-26'
  }
];

// GET /api/departments - List all departments
router.get('/', (_req: Request, res: Response) => {
  try {
    console.log('📊 Fetching departments data');

    res.json({
      success: true,
      departments: departments,
      total: departments.length,
      message: `Retrieved ${departments.length} departments`
    });

    console.log(`✅ Retrieved ${departments.length} departments`);
  } catch (error) {
    console.error('❌ Error fetching departments:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching departments'
    });
  }
});

// POST /api/departments - Create new department
router.post('/', (req: Request, res: Response) => {
  try {
    const {
      name,
      code,
      type,
      headOfDepartment,
      email,
      phone,
      address,
      budget,
      establishedDate
    } = req.body;

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
  } catch (error) {
    console.error('❌ Error creating department:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating department'
    });
  }
});

// PUT /api/departments/:id - Update department
router.put('/:id', (req: Request, res: Response) => {
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
      // Preserve asset counts (they should come from real data)
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
  } catch (error) {
    console.error('❌ Error updating department:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating department'
    });
  }
});

// DELETE /api/departments/:id - Delete department
router.delete('/:id', (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('❌ Error deleting department:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting department'
    });
  }
});

export default router;
