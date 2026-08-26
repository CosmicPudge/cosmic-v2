import "server-only";

import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import type { CosmicAccount } from "@/core/contracts/Account";
import { getAuthRepository } from "./repository";
import { hashSessionToken, parseSessionCookie } from "./localStore";
import { accountAccessMessage, getAccountAccessState } from "./access";

const SESSION_DAYS = 30;
export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
function validEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
export function passwordRecord(password: string, salt = randomBytes(16).toString("hex")) { return { passwordSalt: salt, passwordHash: scryptSync(password, salt, 64).toString("hex") }; }
function passwordMatches(password: string, hash: string, salt: string) { try { const expected = Buffer.from(hash, "hex"); const actual = scryptSync(password, salt, 64); return expected.length === actual.length && timingSafeEqual(expected, actual); } catch { return false; } }
function safeAccount(account: { id: string; email: string; displayName?: string; createdAt: string; updatedAt: string }): CosmicAccount { return { id: account.id, email: account.email, ...(account.displayName ? { displayName: account.displayName } : {}), createdAt: account.createdAt, updatedAt: account.updatedAt }; }
export async function createAccount(input: { email: string; password: string; displayName?: string }) { const email = normalizeEmail(input.email); if (!validEmail(email)) throw new Error("Enter a valid email address."); if (input.password.length < 10) throw new Error("Password must be at least 10 characters."); const record = passwordRecord(input.password); const account = await getAuthRepository().createUser({ id: `user_${randomUUID()}`, email, displayName: input.displayName?.trim() || undefined, ...record }); return safeAccount(account); }
export async function authenticateAccount(emailInput: string, password: string) { const account = await getAuthRepository().findUserByEmail(normalizeEmail(emailInput)); if (!account || account.status !== "active" || !passwordMatches(password, account.passwordHash, account.passwordSalt)) throw new Error("Email or password is incorrect."); const access = await getAccountAccessState(account.id); if (access.status !== "active") throw new Error(accountAccessMessage(access)); return safeAccount(account); }
export async function createSession(accountId: string, userAgent?: string, options?: { sessionType?: "user" | "device"; deviceId?: string; authenticatedBootId?: string; expiresAt?: string }) { const token = randomBytes(32).toString("base64url"); const expiresAt = options?.expiresAt ?? new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString(); const session = await getAuthRepository().createSession({ userId: accountId, tokenHash: hashSessionToken(token), expiresAt, userAgent, sessionType: options?.sessionType, deviceId: options?.deviceId, authenticatedBootId: options?.authenticatedBootId }); return { token, ...session }; }
export async function getSession(request: Request, bootId?: string) { const token = parseSessionCookie(request); if (!token) return null; const session = await getAuthRepository().findSession(hashSessionToken(token)); if (session?.sessionType === "device" && bootId !== undefined && session.authenticatedBootId !== bootId) { await getAuthRepository().revokeSession(hashSessionToken(token)); return null; } return session; }
export async function destroySession(request: Request) { const token = parseSessionCookie(request); if (token) await getAuthRepository().revokeSession(hashSessionToken(token)); }
