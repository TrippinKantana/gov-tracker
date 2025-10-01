/**
 * Authentication & Authorization Middleware
 * RBAC enforcement with department scoping
 */
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requirePermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireRole: (roles: string | string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireDepartmentAccess: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const requireMFA: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const auditSensitiveOperation: (operation: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    authenticateToken: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    requirePermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    requireRole: (roles: string | string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    requireDepartmentAccess: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
    requireMFA: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    auditSensitiveOperation: (operation: string) => (req: Request, res: Response, next: NextFunction) => void;
    securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=authMiddleware.d.ts.map