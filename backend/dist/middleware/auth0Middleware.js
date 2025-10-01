"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireClearanceLevel = exports.requireRole = exports.requirePermission = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const client = (0, jwks_rsa_1.default)({
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    requestHeaders: {},
    timeout: 30000,
});
const getKey = (header, callback) => {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err);
            return;
        }
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
};
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    jsonwebtoken_1.default.verify(token, getKey, {
        audience: process.env.AUTH0_AUDIENCE,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ['RS256'],
    }, (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.status(401).json({ error: 'Invalid token' });
        }
        // Normalize Auth0 claims to AppUser shape
        const roles = decoded['https://gov-tracker.com/roles'] || [];
        const permissions = decoded['https://gov-tracker.com/permissions'] || [];
        const department = decoded['https://gov-tracker.com/department'];
        const clearanceLevel = decoded['https://gov-tracker.com/clearance_level'] ?? 1;
        const appUser = {
            id: decoded.sub,
            email: decoded.email || decoded['https://gov-tracker.com/email'],
            name: decoded.name || decoded['https://gov-tracker.com/name'] || decoded.email,
            roles: Array.isArray(roles) ? roles : [],
            permissions: Array.isArray(permissions) ? permissions : [],
            department: typeof department === 'string' ? department : undefined,
            clearanceLevel,
        };
        req.user = appUser;
        next();
    });
};
exports.verifyToken = verifyToken;
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!req.user.permissions?.includes(permission)) {
            return res.status(403).json({ error: `Permission required: ${permission}` });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!req.user.roles?.includes(role)) {
            return res.status(403).json({ error: `Role required: ${role}` });
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireClearanceLevel = (level) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const userLevel = typeof req.user.clearanceLevel === 'number' ? req.user.clearanceLevel : 1;
        if (userLevel < level) {
            return res.status(403).json({ error: `Clearance level ${level} required` });
        }
        next();
    };
};
exports.requireClearanceLevel = requireClearanceLevel;
//# sourceMappingURL=auth0Middleware.js.map