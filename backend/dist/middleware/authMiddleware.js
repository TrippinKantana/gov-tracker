"use strict";
/**
 * Authentication & Authorization Middleware
 * RBAC enforcement with department scoping
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeaders = exports.auditSensitiveOperation = exports.requireMFA = exports.requireDepartmentAccess = exports.requireRole = exports.requirePermission = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authService_1 = require("../services/authService");
// Verify JWT access token
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }
        // Verify JWT
        const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Get user data
        const user = authService_1.authService.getUsers().get(decoded.sub);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or inactive user'
            });
        }
        // Attach user to request
        req.user = authService_1.authService.sanitizeUser(user);
        console.log(`🔐 Authenticated: ${req.user.username} (${req.user.roles.join(', ')})`);
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                error: 'Access token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        return res.status(403).json({
            success: false,
            error: 'Invalid access token'
        });
    }
};
exports.authenticateToken = authenticateToken;
// Require specific permissions
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        if (!authService_1.authService.hasPermission(req.user, permission)) {
            console.log(`🚫 Permission denied: ${req.user.username} attempted ${permission}`);
            // Log unauthorized access attempt
            authService_1.authService.auditLog('permission_denied', req.user.id, req.user.id, 'permission', permission, 'access', 'failure', {
                requestedPermission: permission,
                userPermissions: req.user.permissions,
                endpoint: req.path
            }, req.ip, req.get('User-Agent'));
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
// Require specific roles
const requireRole = (roles) => {
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
        if (!hasRole) {
            console.log(`🚫 Role access denied: ${req.user.username} attempted ${requiredRoles.join(' or ')}`);
            return res.status(403).json({
                success: false,
                error: 'Insufficient role privileges'
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
// Department scoping middleware
const requireDepartmentAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    // Extract department ID from request (params, body, or query)
    const targetDepartmentId = req.params.departmentId || req.body.departmentId || req.query.departmentId;
    if (!targetDepartmentId) {
        // If no specific department requested, user can access their own department data
        return next();
    }
    if (!authService_1.authService.hasDepartmentAccess(req.user, targetDepartmentId)) {
        console.log(`🚫 Department access denied: ${req.user.username} attempted access to department ${targetDepartmentId}`);
        // Log unauthorized department access attempt
        authService_1.authService.auditLog('department_access_denied', req.user.id, req.user.id, 'department', targetDepartmentId, 'access', 'failure', {
            userDepartment: req.user.departmentId,
            targetDepartment: targetDepartmentId,
            endpoint: req.path
        }, req.ip, req.get('User-Agent'));
        return res.status(403).json({
            success: false,
            error: 'Access denied to this department'
        });
    }
    next();
};
exports.requireDepartmentAccess = requireDepartmentAccess;
// MFA requirement middleware for privileged operations
const requireMFA = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    // Check if user has completed MFA recently (step-up authentication)
    const mfaCompleted = req.headers['x-mfa-verified']; // Would be set by MFA verification
    if (!mfaCompleted && (req.user.mfaEnabled || req.user.roles.some(role => ['super_admin', 'org_admin', 'macs_head', 'auditor'].includes(role)))) {
        return res.status(403).json({
            success: false,
            error: 'MFA verification required for this operation',
            code: 'MFA_REQUIRED'
        });
    }
    next();
};
exports.requireMFA = requireMFA;
// Audit middleware for sensitive operations
const auditSensitiveOperation = (operation) => {
    return (req, res, next) => {
        if (!req.user) {
            return next();
        }
        // Log access to sensitive endpoint
        authService_1.authService.auditLog('sensitive_operation', req.user.id, req.params.userId || req.user.id, 'operation', operation, 'access', 'success', {
            endpoint: req.path,
            method: req.method,
            operation
        }, req.ip, req.get('User-Agent'));
        next();
    };
};
exports.auditSensitiveOperation = auditSensitiveOperation;
// Security headers middleware
const securityHeaders = (req, res, next) => {
    // HSTS (if HTTPS)
    if (req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    // Content Security Policy
    res.setHeader('Content-Security-Policy', "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' wss: ws:; " +
        "font-src 'self';");
    // Other security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
};
exports.securityHeaders = securityHeaders;
exports.default = {
    authenticateToken: exports.authenticateToken,
    requirePermission: exports.requirePermission,
    requireRole: exports.requireRole,
    requireDepartmentAccess: exports.requireDepartmentAccess,
    requireMFA: exports.requireMFA,
    auditSensitiveOperation: exports.auditSensitiveOperation,
    securityHeaders: exports.securityHeaders
};
//# sourceMappingURL=authMiddleware.js.map