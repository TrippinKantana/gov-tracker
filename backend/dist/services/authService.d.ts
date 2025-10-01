/**
 * Government-Grade Authentication Service
 * Implements NIST SP 800-63B and OWASP ASVS Level 2+ standards
 */
interface User {
    id: string;
    username: string;
    email: string;
    fullName: string;
    badgeNumber: string;
    departmentId?: string;
    clearanceLevel: 'standard' | 'elevated' | 'high' | 'restricted';
    isActive: boolean;
    isVerified: boolean;
    requiresPasswordChange: boolean;
    roles: string[];
    permissions: string[];
    lastLoginAt?: Date;
    mfaEnabled: boolean;
    webauthnEnabled: boolean;
    totpEnabled: boolean;
}
interface AuthSession {
    userId: string;
    sessionId: string;
    deviceFingerprint: string;
    ipAddress: string;
    userAgent: string;
    expiresAt: Date;
    refreshTokenHash: string;
}
declare class AuthService {
    private readonly JWT_SECRET;
    private readonly WEBAUTHN_RP_ID;
    private readonly WEBAUTHN_RP_NAME;
    private readonly WEBAUTHN_ORIGIN;
    private users;
    private sessions;
    private rateLimits;
    private auditEvents;
    constructor();
    private initializeDefaultUsers;
    private createDefaultUser;
    hashPassword(password: string): Promise<{
        hash: string;
        salt: Buffer;
        config: any;
    }>;
    verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
    validatePassword(password: string): {
        isValid: boolean;
        errors: string[];
    };
    checkRateLimit(identifier: string, action: string, maxAttempts?: number, windowMinutes?: number): Promise<boolean>;
    authenticate(username: string, password: string, ipAddress: string, userAgent: string): Promise<{
        success: boolean;
        user?: User;
        error?: string;
        requiresMfa?: boolean;
    }>;
    private completeLogin;
    private generateTokens;
    generateWebAuthnRegistrationOptions(userId: string): Promise<any>;
    verifyWebAuthnRegistration(userId: string, credential: any): Promise<{
        verified: boolean;
        credentialId?: string;
    }>;
    enrollTOTP(userId: string): Promise<{
        secret: string;
        qrCode: string;
        backupCodes: string[];
    }>;
    verifyTOTP(userId: string, token: string): Promise<boolean>;
    hasPermission(user: User, permission: string): boolean;
    hasDepartmentAccess(user: User, targetDepartmentId: string): boolean;
    private isPrivilegedRole;
    private sanitizeUser;
    private hashRefreshToken;
    private generateDeviceFingerprint;
    private auditLog;
    private calculateRiskScore;
    getUsers(): Map<string, any>;
    getAuditEvents(): any[];
}
export declare const authService: AuthService;
export type { User, AuthSession };
//# sourceMappingURL=authService.d.ts.map