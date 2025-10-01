"use strict";
/**
 * Personnel API Routes
 * Manage government staff for asset assignment
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const auth0Middleware_1 = require("../middleware/auth0Middleware");
const router = express_1.default.Router();
// Database connection (assuming it's configured)
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
// GET /api/personnel - List all personnel
router.get('/', auth0Middleware_1.verifyToken, async (req, res) => {
    try {
        const authReq = req;
        console.log('📊 Fetching personnel data for user:', authReq.user?.email);
        // Department-scoped access for MAC admins
        let query = 'SELECT * FROM personnel ORDER BY created_at DESC';
        let queryParams = [];
        if (authReq.user?.roles.includes('department_admin') || authReq.user?.roles.includes('mac_admin')) {
            query = 'SELECT * FROM personnel WHERE department_name = $1 ORDER BY created_at DESC';
            queryParams = [authReq.user.department];
        }
        const result = await pool.query(query, queryParams);
        res.json({
            success: true,
            personnel: result.rows,
            total: result.rows.length,
            message: `Retrieved ${result.rows.length} personnel records`
        });
        console.log(`✅ Retrieved ${result.rows.length} personnel records`);
    }
    catch (error) {
        console.error('❌ Error fetching personnel:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching personnel',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// POST /api/personnel - Create new personnel
router.post('/', auth0Middleware_1.verifyToken, async (req, res) => {
    try {
        const authReq = req;
        const { fullName, email, phone, badgeNumber, department, position, clearanceLevel, dateHired, facilityAssignment } = req.body;
        console.log('💾 Creating new personnel:', { fullName, badgeNumber, department });
        // Validation
        if (!fullName || !badgeNumber || !department || !position) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: fullName, badgeNumber, department, position'
            });
        }
        // Check for department access (MAC admins can only create for their department)
        if (authReq.user?.roles.includes('department_admin') || authReq.user?.roles.includes('mac_admin')) {
            if (department !== authReq.user.department) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only create personnel for your assigned department'
                });
            }
        }
        // Insert personnel
        const insertQuery = `
      INSERT INTO personnel (
        full_name, email, phone, badge_number, department_name, position, 
        clearance_level, date_hired, facility_assignment, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
        const insertValues = [
            fullName,
            email || null,
            phone || null,
            badgeNumber,
            department,
            position,
            clearanceLevel || 'standard',
            dateHired || null,
            facilityAssignment || null,
            'active'
        ];
        const result = await pool.query(insertQuery, insertValues);
        const newPersonnel = result.rows[0];
        // Log audit trail
        await pool.query('INSERT INTO audit_logs (user_id, user_email, action, resource_type, resource_id, new_values) VALUES ($1, $2, $3, $4, $5, $6)', [authReq.user?.id, authReq.user?.email, 'CREATE', 'personnel', newPersonnel.id, JSON.stringify(newPersonnel)]);
        res.status(201).json({
            success: true,
            personnel: newPersonnel,
            message: `Personnel ${fullName} created successfully`
        });
        console.log(`✅ Created personnel: ${fullName} (${badgeNumber})`);
    }
    catch (error) {
        console.error('❌ Error creating personnel:', error);
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({
                success: false,
                message: 'Badge number already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating personnel',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// GET /api/personnel/:id - Get personnel details
router.get('/:id', auth0Middleware_1.verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM personnel WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Personnel not found'
            });
        }
        res.json({
            success: true,
            personnel: result.rows[0]
        });
    }
    catch (error) {
        console.error('❌ Error fetching personnel details:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// PUT /api/personnel/:id - Update personnel
router.put('/:id', auth0Middleware_1.verifyToken, async (req, res) => {
    try {
        const authReq = req;
        const { id } = req.params;
        const updateData = req.body;
        console.log('💾 Updating personnel:', id, updateData);
        // Get current personnel for audit
        const currentResult = await pool.query('SELECT * FROM personnel WHERE id = $1', [id]);
        if (currentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Personnel not found'
            });
        }
        const currentPersonnel = currentResult.rows[0];
        // Department access check
        if (authReq.user?.roles.includes('department_admin') || authReq.user?.roles.includes('mac_admin')) {
            if (currentPersonnel.department_name !== authReq.user.department) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only update personnel from your assigned department'
                });
            }
        }
        // Update personnel
        const updateQuery = `
      UPDATE personnel SET
        full_name = COALESCE($1, full_name),
        email = $2,
        phone = $3,
        badge_number = COALESCE($4, badge_number),
        department_name = COALESCE($5, department_name),
        position = COALESCE($6, position),
        clearance_level = COALESCE($7, clearance_level),
        date_hired = $8,
        facility_assignment = $9,
        status = COALESCE($10, status),
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `;
        const updateValues = [
            updateData.fullName,
            updateData.email,
            updateData.phone,
            updateData.badgeNumber,
            updateData.department,
            updateData.position,
            updateData.clearanceLevel,
            updateData.dateHired,
            updateData.facilityAssignment,
            updateData.status,
            id
        ];
        const result = await pool.query(updateQuery, updateValues);
        const updatedPersonnel = result.rows[0];
        // Log audit trail
        await pool.query('INSERT INTO audit_logs (user_id, user_email, action, resource_type, resource_id, old_values, new_values) VALUES ($1, $2, $3, $4, $5, $6, $7)', [authReq.user?.id, authReq.user?.email, 'UPDATE', 'personnel', id, JSON.stringify(currentPersonnel), JSON.stringify(updatedPersonnel)]);
        res.json({
            success: true,
            personnel: updatedPersonnel,
            message: `Personnel ${updatedPersonnel.full_name} updated successfully`
        });
        console.log(`✅ Updated personnel: ${updatedPersonnel.full_name}`);
    }
    catch (error) {
        console.error('❌ Error updating personnel:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating personnel'
        });
    }
});
// DELETE /api/personnel/:id - Delete personnel
router.delete('/:id', auth0Middleware_1.verifyToken, async (req, res) => {
    try {
        const authReq = req;
        const { id } = req.params;
        console.log('🗑️ Deleting personnel:', id);
        // Get personnel for audit and permission check
        const personnelResult = await pool.query('SELECT * FROM personnel WHERE id = $1', [id]);
        if (personnelResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Personnel not found'
            });
        }
        const personnel = personnelResult.rows[0];
        // Department access check
        if (authReq.user?.roles.includes('department_admin') || authReq.user?.roles.includes('mac_admin')) {
            if (personnel.department_name !== authReq.user.department) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete personnel from your assigned department'
                });
            }
        }
        // Begin transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Unassign from vehicles and equipment
            await client.query('UPDATE vehicles SET current_operator_id = NULL, current_operator_name = NULL WHERE current_operator_id = $1', [id]);
            await client.query('UPDATE equipment SET assigned_to_id = NULL, assigned_to_name = NULL WHERE assigned_to_id = $1', [id]);
            // Delete personnel
            await client.query('DELETE FROM personnel WHERE id = $1', [id]);
            // Log audit trail
            await client.query('INSERT INTO audit_logs (user_id, user_email, action, resource_type, resource_id, old_values) VALUES ($1, $2, $3, $4, $5, $6)', [authReq.user?.id, authReq.user?.email, 'DELETE', 'personnel', id, JSON.stringify(personnel)]);
            await client.query('COMMIT');
            res.json({
                success: true,
                message: `Personnel ${personnel.full_name} deleted successfully`
            });
            console.log(`✅ Deleted personnel: ${personnel.full_name}`);
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('❌ Error deleting personnel:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting personnel'
        });
    }
});
exports.default = router;
//# sourceMappingURL=personnel.js.map