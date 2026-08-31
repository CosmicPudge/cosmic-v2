import "server-only";

import { createHash, randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import type { AccountIdentityRecord, AuthRepository, AuthSessionRecord, AuthUserRecord } from "./contracts";
import { toPublicCosmicAccount } from "./serialization";

type StoredAccount = AuthUserRecord;
interface StoredSession { id: string; accountId: string; tokenHash: string; createdAt: string; expiresAt: string; lastUsedAt: string; revokedAt?: string; userAgent?: string }
interface AuthStoreData { version: 1; accounts: StoredAccount[]; sessions: Record<string, StoredSession>; identities?: AccountIdentityRecord[] }

const AUTH_FILE = process.env.COSMIC_AUTH_FILE ?? join(process.cwd(), ".cosmic", "auth-store.json");
const emptyStore: AuthStoreData = { version: 1, accounts: [], sessions: {}, identities: [] };
function readStore(): AuthStoreData { try { if (!existsSync(AUTH_FILE)) return emptyStore; const parsed = JSON.parse(readFileSync(AUTH_FILE, "utf8")) as Partial<AuthStoreData>; return parsed.version === 1 && Array.isArray(parsed.accounts) && parsed.sessions && typeof parsed.sessions === "object" ? parsed as AuthStoreData : emptyStore; } catch { return emptyStore; } }
function writeStore(store: AuthStoreData) { mkdirSync(dirname(AUTH_FILE), { recursive: true }); writeFileSync(AUTH_FILE, JSON.stringify(store, null, 2), { mode: 0o600 }); }
function toSession(stored: StoredSession, account: AuthUserRecord): AuthSessionRecord { return { account: toPublicCosmicAccount(account), sessionId: stored.id, expiresAt: stored.expiresAt, createdAt: stored.createdAt, lastUsedAt: stored.lastUsedAt, ...(stored.userAgent ? { userAgent: stored.userAgent } : {}) }; }

export const fileAuthRepository: AuthRepository = {
  async findUserByEmail(email) { const account = readStore().accounts.find((item) => item.email === email); return account ? { ...account, status: account.status === "disabled" ? "disabled" : "active" } : null; },
  async findUserById(id) { const account = readStore().accounts.find((item) => item.id === id); return account ? { ...account, status: account.status === "disabled" ? "disabled" : "active" } : null; },
  async createUser(input) { const store = readStore(); if (store.accounts.some((account) => account.email === input.email)) throw new Error("An account with that email already exists."); const now = new Date().toISOString(); const account: StoredAccount = { id: input.id, email: input.email, ...(input.displayName ? { displayName: input.displayName } : {}), createdAt: now, updatedAt: now, passwordHash: input.passwordHash ?? null, passwordSalt: input.passwordSalt ?? null, status: "active" }; store.accounts.push(account); writeStore(store); return account; },
  async createSession(input) { const store = readStore(); const account = store.accounts.find((item) => item.id === input.userId); if (!account) throw new Error("Account not found."); const now = new Date().toISOString(); const stored: StoredSession = { id: `session_${randomUUID()}`, accountId: input.userId, tokenHash: input.tokenHash, createdAt: now, expiresAt: input.expiresAt, lastUsedAt: now, ...(input.userAgent ? { userAgent: input.userAgent } : {}) }; store.sessions[input.tokenHash] = stored; writeStore(store); return toSession(stored, account); },
  async findSession(tokenHash) { const store = readStore(); const stored = store.sessions[tokenHash]; if (!stored || stored.revokedAt || Date.parse(stored.expiresAt) <= Date.now()) return null; const account = store.accounts.find((item) => item.id === stored.accountId); if (!account || account.status === "disabled") return null; const now = new Date().toISOString(); stored.id ??= `legacy_${tokenHash.slice(0, 12)}`; stored.createdAt ??= now; stored.lastUsedAt = now; stored.tokenHash ??= tokenHash; writeStore(store); return toSession(stored, { ...account, status: "active" }); },
  async revokeSession(tokenHash) { const store = readStore(); if (store.sessions[tokenHash]) { store.sessions[tokenHash].revokedAt = new Date().toISOString(); writeStore(store); } },
  async revokeAllSessions(userId) { const store = readStore(); const now = new Date().toISOString(); Object.values(store.sessions).forEach((session) => { if (session.accountId === userId && !session.revokedAt) session.revokedAt = now; }); writeStore(store); },
  async deleteUser(userId) { const store = readStore(); store.accounts = store.accounts.filter((account) => account.id !== userId); store.identities = (store.identities ?? []).filter((identity) => identity.accountId !== userId); Object.keys(store.sessions).forEach((token) => { if (store.sessions[token].accountId === userId) delete store.sessions[token]; }); writeStore(store); },
  async listAccountIdentities(accountId) { return (readStore().identities ?? []).filter((identity) => identity.accountId === accountId); },
  async findAccountIdentity(provider, providerSubject) { return (readStore().identities ?? []).find((identity) => identity.provider === provider && identity.providerSubject === providerSubject) ?? null; },
  async createAccountIdentity(input) { const store = readStore(); const now = new Date().toISOString(); const identity: AccountIdentityRecord = { id: `identity_${randomUUID()}`, accountId: input.accountId, provider: input.provider, providerSubject: input.providerSubject, email: input.email, createdAt: now, lastUsedAt: now }; store.identities = [...(store.identities ?? []), identity]; writeStore(store); return identity; },
  async touchAccountIdentity(id) { const store = readStore(); const found = (store.identities ?? []).find((identity) => identity.id === id); if (!found) return null; found.lastUsedAt = new Date().toISOString(); writeStore(store); return found; },
  async deleteAccountIdentity(accountId, id) { const store = readStore(); const before = (store.identities ?? []).length; store.identities = (store.identities ?? []).filter((identity) => !(identity.accountId === accountId && identity.id === id)); if (store.identities.length !== before) { writeStore(store); return true; } return false; },
};

export function hashSessionToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function getSessionCookieName() { return "cosmic_session"; }
export function parseSessionCookie(request: Request) { const raw = request.headers.get("cookie") ?? ""; const match = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${getSessionCookieName()}=`)); return match ? decodeURIComponent(match.slice(getSessionCookieName().length + 1)) : null; }
function cookieValue(token: string, maxAge: number) { const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""; return `${getSessionCookieName()}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`; }
export function sessionCookie(token: string, expiresAt: string) { return cookieValue(token, Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000))); }
export function expiredSessionCookie() { return cookieValue("", 0); }
export function getDeviceCookieName() { return "cosmic_device_id"; }
export function parseDeviceCookie(request: Request) { const raw = request.headers.get("cookie") ?? ""; const match = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${getDeviceCookieName()}=`)); return match ? decodeURIComponent(match.slice(getDeviceCookieName().length + 1)) : null; }
export function deviceCookie(deviceId: string) { const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""; return `${getDeviceCookieName()}=${encodeURIComponent(deviceId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`; }
export function expiredDeviceCookie() { return deviceCookie("").replace("Max-Age=31536000", "Max-Age=0"); }
export function getDeviceCredentialCookieName() { return "cosmic_device_credential"; }
export function parseDeviceCredentialCookie(request: Request) { const raw = request.headers.get("cookie") ?? ""; const match = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${getDeviceCredentialCookieName()}=`)); return match ? decodeURIComponent(match.slice(getDeviceCredentialCookieName().length + 1)) : null; }
export function deviceCredentialCookie(credential: string) { const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""; return `${getDeviceCredentialCookieName()}=${encodeURIComponent(credential)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=315360000${secure}`; }
export function expiredDeviceCredentialCookie() { return deviceCredentialCookie("").replace("Max-Age=315360000", "Max-Age=0"); }
export const DEVICE_SESSION_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;
