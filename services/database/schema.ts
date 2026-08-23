import { sql } from "drizzle-orm";
import { boolean, check, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  normalizedEmail: text("normalized_email").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  displayName: text("display_name"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("users_normalized_email_unique").on(table.normalizedEmail)]);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionTokenHash: text("session_token_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  userAgent: text("user_agent"),
}, (table) => [uniqueIndex("sessions_token_hash_unique").on(table.sessionTokenHash), index("sessions_user_id_index").on(table.userId), index("sessions_expires_at_index").on(table.expiresAt)]);

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  payload: jsonb("payload").notNull(),
  revision: integer("revision").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accountEntitlements = pgTable("account_entitlements", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("free"),
  source: text("source").notNull().default("account"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [check("account_entitlements_plan_check", sql`${table.plan} in ('free', 'cosmic_plus')`), check("account_entitlements_source_check", sql`${table.source} in ('account', 'development-override')`)]);

export const billingSubscriptions = pgTable("billing_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("stripe"),
  providerCustomerId: text("provider_customer_id"),
  providerSubscriptionId: text("provider_subscription_id"),
  providerPriceId: text("provider_price_id"),
  status: text("status").notNull().default("inactive"),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  lastEventCreated: integer("last_event_created"),
  lastEventId: text("last_event_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("billing_subscriptions_user_provider_unique").on(table.userId, table.provider), uniqueIndex("billing_subscriptions_customer_unique").on(table.providerCustomerId), uniqueIndex("billing_subscriptions_subscription_unique").on(table.providerSubscriptionId), index("billing_subscriptions_status_index").on(table.status), check("billing_subscriptions_provider_check", sql`${table.provider} = 'stripe'`), check("billing_subscriptions_status_check", sql`${table.status} in ('inactive', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')`)]);

export const billingWebhookEvents = pgTable("billing_webhook_events", {
  eventId: text("event_id").primaryKey(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const syncDocuments = pgTable("sync_documents", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  payload: jsonb("payload").notNull(),
  revision: integer("revision").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("sync_documents_user_domain_unique").on(table.userId, table.domain), index("sync_documents_user_id_index").on(table.userId), check("sync_documents_domain_check", sql`${table.domain} in ('notes', 'projects', 'finance', 'garage', 'school')`)]);

export const providerConnections = pgTable("provider_connections", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerType: text("provider_type"),
  providerAccountId: text("provider_account_id"),
  displayName: text("display_name"),
  email: text("email"),
  status: text("status").notNull().default("connected"),
  reconnectRequired: boolean("reconnect_required").notNull().default(false),
  lastSuccessfulRefreshAt: timestamp("last_successful_refresh_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("provider_connections_user_id_index").on(table.userId), index("provider_connections_user_provider_index").on(table.userId, table.provider), uniqueIndex("provider_connections_user_provider_account_unique").on(table.userId, table.provider, table.providerAccountId)]);

export const providerCredentials = pgTable("provider_credentials", {
  connectionId: text("connection_id").primaryKey().references(() => providerConnections.id, { onDelete: "cascade" }),
  encryptedPayload: text("encrypted_payload").notNull(),
  keyVersion: text("key_version").notNull().default("v1"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accountRoles = pgTable("account_roles", {
  accountId: text("account_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: text("created_by"),
}, (table) => [primaryKey({ columns: [table.accountId, table.role] }), check("account_roles_role_check", sql`${table.role} in ('user', 'admin')`), index("account_roles_role_index").on(table.role)]);

export const adminEntitlementOverrides = pgTable("admin_entitlement_overrides", {
  accountId: text("account_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [check("admin_entitlement_overrides_plan_check", sql`${table.plan} in ('free', 'cosmic_plus')`), index("admin_entitlement_overrides_expires_index").on(table.expiresAt)]);

export const accountModeration = pgTable("account_moderation", {
  accountId: text("account_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
  reason: text("reason"),
  internalNote: text("internal_note"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: text("created_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [check("account_moderation_status_check", sql`${table.status} in ('active', 'suspended', 'banned')`), index("account_moderation_status_expires_index").on(table.status, table.expiresAt)]);

export const adminAuditLog = pgTable("admin_audit_log", {
  id: text("id").primaryKey(),
  actorAccountId: text("actor_account_id"),
  targetAccountId: text("target_account_id"),
  action: text("action").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  correlationId: text("correlation_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("admin_audit_log_created_index").on(table.createdAt), index("admin_audit_log_target_index").on(table.targetAccountId), index("admin_audit_log_actor_index").on(table.actorAccountId)]);
