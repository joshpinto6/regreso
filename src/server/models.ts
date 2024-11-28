export interface User {
  id: number;
  email: string;
  name: string;
  displayName: string;
  googleId?: string | null;
  githubId?: number | null;
  emailVerified: boolean;
  registered2FA: boolean;
}

export interface SessionFlags {
  twoFactorVerified: boolean;
}

export interface Session extends SessionFlags {
  id: string;
  expiresAt: Date;
  userId: number;
}
