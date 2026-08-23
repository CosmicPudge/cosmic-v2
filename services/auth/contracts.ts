import type { CosmicAccount, CosmicSession } from "@/core/contracts/Account";

export interface AuthUserRecord extends CosmicAccount {
  passwordHash: string;
  passwordSalt: string;
  status: "active" | "disabled";
}

export interface AuthSessionRecord extends CosmicSession {
  sessionId: string;
  createdAt: string;
  lastUsedAt: string;
  userAgent?: string;
}

export interface AuthRepository {
  findUserByEmail(email: string): Promise<AuthUserRecord | null>;
  findUserById(id: string): Promise<AuthUserRecord | null>;
  createUser(input: { id: string; email: string; displayName?: string; passwordHash: string; passwordSalt: string }): Promise<AuthUserRecord>;
  createSession(input: { userId: string; tokenHash: string; expiresAt: string; userAgent?: string }): Promise<AuthSessionRecord>;
  findSession(tokenHash: string): Promise<AuthSessionRecord | null>;
  revokeSession(tokenHash: string): Promise<void>;
  revokeAllSessions(userId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
}
