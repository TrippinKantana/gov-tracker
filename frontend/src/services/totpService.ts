/**
 * Government TOTP Service
 * RFC 6238 compliant Time-based One-Time Password implementation
 */

import { TOTP } from 'otpauth';
import QRCode from 'qrcode';

interface TOTPSetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  issuer: string;
  accountName: string;
}

class TOTPService {
  private readonly issuer = 'General Services Agency - Liberia';
  
  // Generate TOTP secret and QR code for enrollment
  async generateTOTPSetup(user: { fullName: string; badgeNumber: string; email: string }): Promise<TOTPSetupData> {
    try {
      // Generate a secure random secret (32 bytes = 256 bits)
      const secret = this.generateSecretKey();
      
      // Create TOTP instance
      const totp = new TOTP({
        issuer: this.issuer,
        label: `${user.fullName} (${user.badgeNumber})`,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(totp.toString());
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      console.log('🔒 TOTP setup generated for:', user.fullName);
      console.log('🔑 Secret:', secret);
      console.log('🎫 Backup codes:', backupCodes);

      return {
        secret,
        qrCodeUrl,
        backupCodes,
        issuer: this.issuer,
        accountName: `${user.fullName} (${user.badgeNumber})`
      };
    } catch (error) {
      console.error('Error generating TOTP setup:', error);
      throw new Error('Failed to generate TOTP setup');
    }
  }

  // Verify TOTP code
  verifyTOTPCode(secret: string, code: string): boolean {
    try {
      const totp = new TOTP({
        issuer: this.issuer,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret
      });

      // Validate the token with a window of ±1 period (90 seconds total)
      const currentTime = Date.now();
      const period = 30 * 1000; // 30 seconds in milliseconds
      
      // Check current time window and ±1 windows for clock drift tolerance
      for (let window = -1; window <= 1; window++) {
        const timestamp = currentTime + (window * period);
        const expectedCode = totp.generate({ timestamp });
        
        if (code === expectedCode) {
          console.log('✅ TOTP verification successful');
          return true;
        }
      }

      console.log('❌ TOTP verification failed for code:', code);
      return false;
    } catch (error) {
      console.error('Error verifying TOTP:', error);
      return false;
    }
  }

  // Generate current TOTP code (for testing)
  generateCurrentCode(secret: string): string {
    try {
      const totp = new TOTP({
        issuer: this.issuer,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret
      });

      return totp.generate();
    } catch (error) {
      console.error('Error generating current code:', error);
      return '000000';
    }
  }

  // Generate secure random secret key
  private generateSecretKey(): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    
    for (let i = 0; i < randomBytes.length; i++) {
      result += charset[randomBytes[i] % charset.length];
    }
    
    return result;
  }

  // Generate backup recovery codes
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      const randomBytes = new Uint8Array(4);
      crypto.getRandomValues(randomBytes);
      
      const code = Array.from(randomBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
        .match(/.{1,4}/g)
        ?.join('-') || '';
        
      codes.push(code);
    }
    
    return codes;
  }

  // Get demo secret for testing (GSA Admin)
  getDemoSecret(): string {
    return 'JBSWY3DPEHPK3PXP';
  }

  // Get current demo code for testing
  getDemoCurrentCode(): string {
    return this.generateCurrentCode(this.getDemoSecret());
  }
}

export const totpService = new TOTPService();
export type { TOTPSetupData };
