export interface AppUser {
  id: string;
  email?: string;
  username?: string;
  name?: string;        // display name
  fullName?: string;    // for internal user
  roles: string[];
  permissions: string[];
  department?: string;  // name (Auth0)
  departmentId?: string; // internal
  clearanceLevel?: string | number; // allow both (internal vs Auth0)
  isActive?: boolean;
  isVerified?: boolean;
  requiresPasswordChange?: boolean;
  lastLoginAt?: Date;
  mfaEnabled?: boolean;
  webauthnEnabled?: boolean;
  totpEnabled?: boolean;
}
