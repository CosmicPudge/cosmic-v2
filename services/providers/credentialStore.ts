import "server-only";

import type { ProviderCredentialOwner, ProviderId } from "./access";

export type ProviderCredentialPayload = Record<string, unknown>;

export interface ProviderCredentialStore {
  get<T extends ProviderCredentialPayload = ProviderCredentialPayload>(
    owner: ProviderCredentialOwner,
    provider: ProviderId,
  ): Promise<T | null>;
  set(owner: ProviderCredentialOwner, provider: ProviderId, credential: ProviderCredentialPayload): Promise<void>;
  delete(owner: ProviderCredentialOwner, provider: ProviderId): Promise<boolean>;
  has(owner: ProviderCredentialOwner, provider: ProviderId): Promise<boolean>;
}
