import type { AppUser } from './app';

declare global {
  namespace Express {
    interface Request {
      user?: AppUser;
      deviceFingerprint?: string;
      session?: any;
    }
  }
}

export {};
