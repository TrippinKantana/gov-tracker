"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Health check for auth
router.get('/health', (_req, res) => {
    res.json({
        status: 'Auth0 service healthy',
        domain: process.env.AUTH0_DOMAIN ? 'configured' : 'missing',
        audience: process.env.AUTH0_AUDIENCE ? 'configured' : 'missing'
    });
});
exports.default = router;
//# sourceMappingURL=auth0.js.map