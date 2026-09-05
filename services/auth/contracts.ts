import type { CosmicAccount, CosmicSession } from "@/core/contracts/Account";

export interface AuthUserRecord extends CosmicAccount {
  passwordHash: string | null;
  passwordSalt: string | null;
  status: "active" | "disabled";
}

export interface AuthSessionRecord extends CosmicSession {
  sessionId: string;
  createdAt: string;
  lastUsedAt: string;
  userAgent?: string;
}

export interface PasswordResetTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
}

export interface CreateSessionInput {
  userId: string;
  tokenHash: string;
  expiresAt: string;
  userAgent?: string;
  sessionType?: "user" | "device";
  deviceId?: string;
  authenticatedBootId?: string;
}

export interface AccountIdentityRecord {
  id: string;
  accountId: string;
  provider: "password" | "google" | "microsoft" | "apple";
  providerSubject: string;
  email?: string | null;
  createdAt: string;
  lastUsedAt: string;
}

export interface AuthRepository {
  findUserByEmail(email: string): Promise<AuthUserRecord | null>;
  findUserById(id: string): Promise<AuthUserRecord | null>;
  createUser(input: { id: string; email: string; displayName?: string; passwordHash?: string | null; passwordSalt?: string | null }): Promise<AuthUserRecord>;
  createSession(input: CreateSessionInput): Promise<AuthSessionRecord>;
  findSession(tokenHash: string): Promise<AuthSessionRecord | null>;
  revokeSession(tokenHash: string): Promise<void>;
  revokeAllSessions(userId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  listAccountIdentities(accountId: string): Promise<AccountIdentityRecord[]>;
  findAccountIdentity(provider: AccountIdentityRecord["provider"], providerSubject: string): Promise<AccountIdentityRecord | null>;
  createAccountIdentity(input: { accountId: string; provider: Exclude<AccountIdentityRecord["provider"], "password">; providerSubject: string; email?: string }): Promise<AccountIdentityRecord>;
  touchAccountIdentity(id: string): Promise<AccountIdentityRecord | null>;
  deleteAccountIdentity(accountId: string, id: string): Promise<boolean>;
  createPasswordResetToken(input: { id: string; userId: string; tokenHash: string; expiresAt: string }): Promise<PasswordResetTokenRecord>;
  findPasswordResetToken(tokenHash: string): Promise<(PasswordResetTokenRecord & { user: AuthUserRecord }) | null>;
  completePasswordReset(tokenHash: string, passwordHash: string, passwordSalt: string): Promise<AuthUserRecord | null>;
}
