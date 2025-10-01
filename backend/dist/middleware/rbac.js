"use strict";
/**
 * Role-Based Access Control (RBAC) Middleware
 * Government-grade authorization with department scoping
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceFingerprint = exports.securityHeaders = exports.requireMFA = exports.auditRequest = exports.requireClearanceLevel = exports.requireDepartmentAccess = exports.requireRole = exports.requirePermission = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authService_1 = require("../services/authService");
// JWT verification middleware
const verifyToken = async (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'dev-secret-change-in-production');
        // In production, verify against database and check session validity
        const user = {
            id: decoded.sub,
            username: decoded.username,
            email: decoded.email,
            fullName: decoded.fullName || 'Unknown',
            badgeNumber: decoded.badgeNumber || 'UNKNOWN',
            departmentId: decoded.departmentId,
            clearanceLevel: decoded.clearanceLevel || 'standard',
            isActive: true,
            isVerified: true,
            requiresPasswordChange: false,
            roles: decoded.roles || [],
            permissions: decoded.permissions || [],
            lastLoginAt: decoded.lastLoginAt ? new Date(decoded.lastLoginAt) : undefined,
            mfaEnabled: decoded.mfaEnabled || false,
            webauthnEnabled: decoded.webauthnEnabled || false,
            totpEnabled: decoded.totpEnabled || false
        };
        req.user = user;
        req.session = { sessionId: decoded.sessionId, jti: decoded.jti };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }
        console.error('Token verification error:', error);
        return res.status(500).json({
            success: false,
            error: 'Token verification failed'
        });
    }
};
exports.verifyToken = verifyToken;
// Permission-based authorization
const requirePermission = (permission) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const hasPermission = authService_1.authService.hasPermission(req.user, permission);
        if (!hasPermission) {
            // Log unauthorized access attempt
            console.warn(`🚫 Unauthorized access attempt: ${req.user.username} tried to access ${permission}`);
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                required: permission,
                userPermissions: req.user.permissions
            });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
// Role-based authorization
const requireRole = (roleNames) => {
    const roles = Array.isArray(roleNames) ? roleNames : [roleNames];
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const hasRole = roles.some(role => req.user.roles.includes(role));
        if (!hasRole) {
            console.warn(`🚫 Role access denied: ${req.user.username} requires roles: ${roles.join(', ')}`);
            return res.status(403).json({
                success: false,
                error: 'Insufficient role privileges',
                required: roles,
                userRoles: req.user.roles
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
    const targetDepartmentId = req.params.departmentId || req.body.departmentId || req.query.departmentId;
    if (!targetDepartmentId) {
        return res.status(400).json({
            success: false,
            error: 'Department ID required for this operation'
        });
    }
    const hasAccess = authService_1.authService.hasDepartmentAccess(req.user, targetDepartmentId);
    if (!hasAccess) {
        console.warn(`🏛️ Department access denied: ${req.user.username} tried to access department ${targetDepartmentId}`);
        return res.status(403).json({
            success: false,
            error: 'Access denied to this department',
            userDepartment: req.user.departmentId,
            requestedDepartment: targetDepartmentId
        });
    }
    next();
};
exports.requireDepartmentAccess = requireDepartmentAccess;
// Clearance level check
const requireClearanceLevel = (minimumLevel) => {
    const clearanceLevels = {
        'standard': 1,
        'elevated': 2,
        'high': 3,
        'restricted': 4
    };
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const userLevel = clearanceLevels[req.user.clearanceLevel];
        const requiredLevel = clearanceLevels[minimumLevel];
        if (userLevel < requiredLevel) {
            console.warn(`🔒 Clearance denied: ${req.user.username} (${req.user.clearanceLevel}) tried to access ${minimumLevel} resource`);
            return res.status(403).json({
                success: false,
                error: 'Insufficient security clearance',
                required: minimumLevel,
                userClearance: req.user.clearanceLevel
            });
        }
        next();
    };
};
exports.requireClearanceLevel = requireClearanceLevel;
// Audit logging middleware
const auditRequest = (action, resourceType) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        res.send = function (data) {
            // Log the request outcome
            const outcome = res.statusCode < 400 ? 'success' : 'failure';
            const resourceId = req.params.id || req.body.id || 'unknown';
            // Note: In production, this would write to immutable audit log
            console.log(`📊 AUDIT: ${req.user?.username || 'anonymous'} ${action} ${resourceType}:${resourceId} - ${outcome}`);
            return originalSend.call(this, data);
        };
        next();
    };
};
exports.auditRequest = auditRequest;
// MFA enforcement for privileged operations
const requireMFA = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    // Check if user has privileged role that requires MFA
    const privilegedRoles = ['super_admin', 'org_admin', 'macs_head', 'auditor'];
    const hasPrivilegedRole = req.user.roles.some(role => privilegedRoles.includes(role));
    if (hasPrivilegedRole && !req.user.mfaEnabled) {
        return res.status(403).json({
            success: false,
            error: 'MFA required for this operation',
            code: 'MFA_REQUIRED'
        });
    }
    // Check if MFA was recently verified (step-up authentication)
    const mfaTimestamp = req.headers['x-mfa-timestamp'];
    const mfaWindow = 10 * 60 * 1000; // 10 minutes
    if (hasPrivilegedRole && req.user.mfaEnabled) {
        if (!mfaTimestamp || (Date.now() - parseInt(mfaTimestamp)) > mfaWindow) {
            return res.status(403).json({
                success: false,
                error: 'Recent MFA verification required',
                code: 'MFA_STEPUP_REQUIRED'
            });
        }
    }
    next();
};
exports.requireMFA = requireMFA;
// Security headers middleware
const securityHeaders = (req, res, next) => {
    // OWASP security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    // HSTS for production
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
};
exports.securityHeaders = securityHeaders;
// Device fingerprinting for session security
const deviceFingerprint = (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';
    const fingerprint = require('crypto')
        .createHash('sha256')
        .update(userAgent + acceptLanguage + acceptEncoding)
        .digest('hex');
    req.deviceFingerprint = fingerprint;
    next();
};
exports.deviceFingerprint = deviceFingerprint;
//# sourceMappingURL=rbac.js.map