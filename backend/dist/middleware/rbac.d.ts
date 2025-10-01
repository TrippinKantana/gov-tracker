/**
 * Role-Based Access Control (RBAC) Middleware
 * Government-grade authorization with department scoping
 */
import express from 'express';
import { User } from '../services/authService';
interface AuthenticatedRequest extends express.Request {
    user?: User;
    session?: any;
}
export declare const verifyToken: (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => Promise<express.Response<any, Record<string, any>> | undefined>;
export declare const requirePermission: (permission: string) => (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => Promise<express.Response<any, Record<string, any>> | undefined>;
export declare const requireRole: (roleNames: string | string[]) => (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => Promise<express.Response<any, Record<string, any>> | undefined>;
export declare const requireDepartmentAccess: (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => express.Response<any, Record<string, any>> | undefined;
export declare const requireClearanceLevel: (minimumLevel: "standard" | "elevated" | "high" | "restricted") => (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => Promise<express.Response<any, Record<string, any>> | undefined>;
export declare const auditRequest: (action: string, resourceType: string) => (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => Promise<void>;
export declare const requireMFA: (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => Promise<express.Response<any, Record<string, any>> | undefined>;
export declare const securityHeaders: (req: express.Request, res: express.Response, next: express.NextFunction) => void;
export declare const deviceFingerprint: (req: express.Request, res: express.Response, next: express.NextFunction) => void;
export type { AuthenticatedRequest };
//# sourceMappingURL=rbac.d.ts.map