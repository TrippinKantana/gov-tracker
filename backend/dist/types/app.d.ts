export interface AppUser {
    id: string;
    email?: string;
    username?: string;
    name?: string;
    fullName?: string;
    roles: string[];
    permissions: string[];
    department?: string;
    departmentId?: string;
    clearanceLevel?: string | number;
    isActive?: boolean;
    isVerified?: boolean;
    requiresPasswordChange?: boolean;
    lastLoginAt?: Date;
    mfaEnabled?: boolean;
    webauthnEnabled?: boolean;
    totpEnabled?: boolean;
}
//# sourceMappingURL=app.d.ts.map