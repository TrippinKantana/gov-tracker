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
// Login endpoint
router.post('/login', [
    (0, express_validator_1.body)('username').notEmpty().trim(),
    (0, express_validator_1.body)('password').notEmpty().isLength({ min: 6 }),
    handleValidation
], async (req, res) => {
    try {
        const { username, password } = req.body;
        // Mock authentication - replace with real auth logic
        if (username === 'admin' && password === 'admin123') {
            const mockUser = {
                id: 'user-001',
                username,
                role: 'admin',
                department: 'General Services Agency',
                fullName: 'System Administrator'
            };
            res.json({
                success: true,
                user: mockUser,
                token: 'mock-jwt-token',
                message: 'Login successful'
            });
        }
        else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    }
    catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map