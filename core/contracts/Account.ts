export interface CosmicAccount {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CosmicSession {
  account: CosmicAccount;
  expiresAt: string;
  sessionId?: string;
  createdAt?: string;
  lastUsedAt?: string;
  userAgent?: string;
}
