import "server-only";

import { createHash, createPublicKey, createVerify, timingSafeEqual } from "node:crypto";
import type { FinancialDataProvider, FinancialProviderCapabilities, FinancialProviderEnvironment, ProviderAccount, ProviderInstitution, ProviderTransaction } from "./types";
import { minorFromProviderAmount } from "./types";

type PlaidResponse = Record<string, unknown>;

const environments: Record<FinancialProviderEnvironment, string> = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com",
};

function config() {
  const environment = (process.env.PLAID_ENV ?? "sandbox") as FinancialProviderEnvironment;
  if (!(environment in environments)) throw new Error("PLAID_ENV must be sandbox, development, or production.");
  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) throw new Error("Plaid provider credentials are not configured.");
  return { environment, baseUrl: environments[environment], clientId: process.env.PLAID_CLIENT_ID, secret: process.env.PLAID_SECRET };
}

async function plaidRequest(path: string, body: Record<string, unknown>) {
  const current = config();
  const response = await fetch(`${current.baseUrl}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: current.clientId, secret: current.secret, ...body }), cache: "no-store" });
  const payload = await response.json().catch(() => null) as PlaidResponse | null;
  if (!response.ok || payload?.error_code) {
    const code = typeof payload?.error_code === "string" ? payload.error_code : "provider_error";
    const message = typeof payload?.error_message === "string" ? payload.error_message : "Plaid request failed.";
    const error = new Error(message); error.name = `Plaid:${code}`; throw error;
  }
  return payload ?? {};
}

function base64UrlJson(value: string) { return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>; }
function es256SignatureToDer(signature: Buffer) {
  const integer = (value: Buffer) => { const normalized = value[0] & 0x80 ? Buffer.concat([Buffer.from([0]), value]) : value; return Buffer.concat([Buffer.from([0x02, normalized.length]), normalized]); };
  const body = Buffer.concat([integer(signature.subarray(0, 32)), integer(signature.subarray(32, 64))]);
  return Buffer.concat([Buffer.from([0x30, body.length]), body]);
}

export async function verifyPlaidWebhook(rawBody: string, signedHeader: string | null) {
  if (!signedHeader) return false;
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = signedHeader.split(".");
    if (!encodedHeader || !encodedPayload || !encodedSignature) return false;
    const header = base64UrlJson(encodedHeader);
    const payload = base64UrlJson(encodedPayload);
    if (header.alg !== "ES256" || typeof header.kid !== "string" || typeof payload.iat !== "number" || Math.abs(Date.now() / 1000 - payload.iat) > 300 || typeof payload.request_body_sha256 !== "string") return false;
    const keyResponse = await plaidRequest("/webhook_verification_key/get", { key_id: header.kid });
    const jwk = asRecord(keyResponse.key);
    const publicKey = createPublicKey({ key: jwk, format: "jwk" });
    const signature = Buffer.from(encodedSignature, "base64url");
    if (signature.length !== 64) return false;
    const verifier = createVerify("SHA256"); verifier.update(`${encodedHeader}.${encodedPayload}`); verifier.end();
    if (!verifier.verify(publicKey, es256SignatureToDer(signature))) return false;
    const expected = Buffer.from(payload.request_body_sha256, "hex");
    const actual = createHash("sha256").update(rawBody).digest();
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch { return false; }
}

function asRecord(value: unknown): PlaidResponse { return typeof value === "object" && value !== null && !Array.isArray(value) ? value as PlaidResponse : {}; }
function asString(value: unknown) { return typeof value === "string" && value ? value : undefined; }
function asMinor(value: unknown) { return value === null || value === undefined ? undefined : minorFromProviderAmount(value); }

function accountType(value: unknown): ProviderAccount["type"] {
  if (value === "depository") return "checking";
  if (value === "credit") return "credit";
  if (value === "loan") return "loan";
  if (value === "investment") return "investment";
  return "other";
}

function transaction(value: unknown): ProviderTransaction | null {
  const item = asRecord(value);
  const id = asString(item.transaction_id);
  const accountId = asString(item.account_id);
  const description = asString(item.name) ?? asString(item.original_description);
  const amount = typeof item.amount === "number" ? item.amount : null;
  if (!id || !accountId || !description || amount === null) return null;
  const category = asRecord(item.personal_finance_category);
  return {
    providerTransactionId: id,
    ...(asString(item.pending_transaction_id) ? { pendingProviderTransactionId: asString(item.pending_transaction_id) } : {}),
    providerAccountId: accountId,
    ...(asString(item.date) ? { postedDate: asString(item.date) } : {}),
    ...(asString(item.authorized_date) ? { authorizedDate: asString(item.authorized_date) } : {}),
    description,
    ...(asString(item.merchant_name) ? { merchant: asString(item.merchant_name) } : {}),
    amountMinor: minorFromProviderAmount(amount),
    direction: amount < 0 ? "income" : "expense",
    status: item.pending === true ? "pending" : "cleared",
    ...(asString(category.primary) ? { providerCategory: asString(category.primary) } : {}),
    ...(asString(item.payment_channel) ? { paymentChannel: asString(item.payment_channel) } : {}),
    currency: asString(item.iso_currency_code) ?? "USD",
  };
}

export class PlaidFinancialProvider implements FinancialDataProvider {
  readonly name = "plaid";
  readonly environment = config().environment;
  readonly capabilities: FinancialProviderCapabilities = { supportsAccounts: true, supportsBalances: true, supportsTransactions: true, supportsRecurring: true, supportsWebhooks: true, supportsOAuth: true, supportsManualVerification: false, supportsRefresh: true, supportsDisconnect: true, supportsInstitutionSearch: true };

  async searchInstitutions(query: string): Promise<ProviderInstitution[]> {
    const payload = await plaidRequest("/institutions/get", { count: 500, offset: 0, country_codes: ["US"], options: { include_optional_metadata: true } });
    const normalized = query.trim().toLocaleLowerCase();
    const institutions = Array.isArray(payload.institutions) ? payload.institutions : [];
    return institutions.flatMap((value): ProviderInstitution[] => { const item = asRecord(value); const id = asString(item.institution_id); const name = asString(item.name); if (!id || !name || (normalized && !name.toLocaleLowerCase().includes(normalized))) return []; return [{ providerInstitutionId: id, name, ...(asString(item.url) ? { url: asString(item.url) } : {}), countryCodes: ["US"] }]; });
  }

  async createConnectionSession(input: { userId: string; webhookUrl: string }) {
    const payload = await plaidRequest("/link/token/create", { user: { client_user_id: input.userId }, client_name: "Cosmic OS", products: ["transactions"], country_codes: ["US"], language: "en", transactions: { days_requested: 90 }, webhook: input.webhookUrl, ...(process.env.PLAID_REDIRECT_URI ? { redirect_uri: process.env.PLAID_REDIRECT_URI } : {}) });
    return { linkToken: String(payload.link_token), ...(asString(payload.expiration) ? { expiration: asString(payload.expiration) } : {}) };
  }

  async exchangeConnectionToken(publicToken: string) {
    const payload = await plaidRequest("/item/public_token/exchange", { public_token: publicToken });
    const item = asRecord(payload.item);
    const institution = asRecord(payload.institution);
    return { accessToken: String(payload.access_token), providerConnectionId: String(item.item_id), ...(asString(item.institution_id) ? { institutionId: asString(item.institution_id) } : {}), ...(asString(institution.name) ? { institutionName: asString(institution.name) } : {}) };
  }

  async getAccounts(accessToken: string) {
    const payload = await plaidRequest("/accounts/balance/get", { access_token: accessToken });
    const accounts = Array.isArray(payload.accounts) ? payload.accounts : [];
    return accounts.flatMap((value): ProviderAccount[] => { const item = asRecord(value); const id = asString(item.account_id); const name = asString(item.name); if (!id || !name) return []; return [{ providerAccountId: id, name, type: accountType(item.type), ...(asString(item.subtype) ? { subtype: asString(item.subtype) } : {}), ...(asString(item.mask) ? { mask: asString(item.mask) } : {}), currency: asString(item.iso_currency_code) ?? "USD", currentBalanceMinor: asMinor(item.balances && asRecord(item.balances).current), availableBalanceMinor: asMinor(item.balances && asRecord(item.balances).available), creditLimitMinor: asMinor(item.balances && asRecord(item.balances).limit) }]; });
  }

  async syncTransactions(accessToken: string, cursor?: string) {
    const payload = await plaidRequest("/transactions/sync", { access_token: accessToken, ...(cursor ? { cursor } : {}) });
    const map = (value: unknown) => Array.isArray(value) ? value.flatMap((item) => { const normalized = transaction(item); return normalized ? [normalized] : []; }) : [];
    const removed = Array.isArray(payload.removed) ? payload.removed.flatMap((value) => { const id = asString(asRecord(value).transaction_id); return id ? [id] : []; }) : [];
    return { added: map(payload.added), modified: map(payload.modified), removedProviderTransactionIds: removed, nextCursor: String(payload.next_cursor ?? ""), hasMore: payload.has_more === true };
  }

  async disconnect(accessToken: string) { await plaidRequest("/item/remove", { access_token: accessToken }); }
}

export function getPlaidFinancialProvider() { return new PlaidFinancialProvider(); }
