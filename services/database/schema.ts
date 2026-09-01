import { sql } from "drizzle-orm";
import { boolean, check, doublePrecision, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  normalizedEmail: text("normalized_email").notNull(),
  passwordHash: text("password_hash"),
  passwordSalt: text("password_salt"),
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
  sessionType: text("session_type").notNull().default("user"),
  deviceId: text("device_id"),
  authenticatedBootId: text("authenticated_boot_id"),
}, (table) => [uniqueIndex("sessions_token_hash_unique").on(table.sessionTokenHash), index("sessions_user_id_index").on(table.userId), index("sessions_expires_at_index").on(table.expiresAt), index("sessions_device_id_index").on(table.deviceId), check("sessions_type_check", sql`${table.sessionType} in ('user', 'device')`)]);

export const devices = pgTable("devices", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  publicNumber: text("public_number").notNull(),
  credentialHash: text("credential_hash"),
  credentialRevokedAt: timestamp("credential_revoked_at", { withTimezone: true }),
  ownershipStatus: text("ownership_status").notNull().default("owned"),
  name: text("name").notNull().default("Cosmic Display"),
  type: text("type").notNull().default("display"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
}, (table) => [uniqueIndex("devices_public_number_unique").on(table.publicNumber), index("devices_user_id_index").on(table.userId), index("devices_active_index").on(table.revokedAt), check("devices_ownership_status_check", sql`${table.ownershipStatus} in ('owned', 'unclaimed', 'resetting')`)]);

export const phoneLocations = pgTable("phone_locations", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  accuracy: doublePrecision("accuracy"),
  label: text("label"),
  city: text("city"),
  region: text("region"),
  country: text("country"),
  timezone: text("timezone"),
  reportedAt: timestamp("reported_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [check("phone_locations_latitude_check", sql`${table.latitude} between -90 and 90`), check("phone_locations_longitude_check", sql`${table.longitude} between -180 and 180`), index("phone_locations_reported_at_index").on(table.reportedAt)]);

export const kioskDeviceSettings = pgTable("kiosk_device_settings", {
  deviceId: text("device_id").primaryKey().references(() => devices.id, { onDelete: "cascade" }),
  setupCompleted: boolean("setup_completed").notNull().default(false),
  setupVersion: integer("setup_version").notNull().default(0),
  viewportWidth: integer("viewport_width"),
  viewportHeight: integer("viewport_height"),
  physicalScreenWidth: integer("physical_screen_width"),
  physicalScreenHeight: integer("physical_screen_height"),
  devicePixelRatio: doublePrecision("device_pixel_ratio"),
  aspectRatio: doublePrecision("aspect_ratio"),
  orientation: text("orientation"),
  density: text("density"),
  uiScale: doublePrecision("ui_scale").notNull().default(1),
  setupPreview: text("setup_preview").notNull().default("normal"),
  nightDimPreview: boolean("night_dim_preview").notNull().default(false),
  touchDetected: boolean("touch_detected"),
  pointer: text("pointer"),
  timezone: text("timezone"),
  reportedTimezone: text("reported_timezone"),
  timezoneOverride: text("timezone_override"),
  clockFormat: text("clock_format"),
  locationMode: text("location_mode").notNull().default("account"),
  locationLatitude: doublePrecision("location_latitude"),
  locationLongitude: doublePrecision("location_longitude"),
  locationLabel: text("location_label"),
  locationRegion: text("location_region"),
  locationCountry: text("location_country"),
  locationTimezone: text("location_timezone"),
  reportedLocationLatitude: doublePrecision("reported_location_latitude"),
  reportedLocationLongitude: doublePrecision("reported_location_longitude"),
  reportedLocationLabel: text("reported_location_label"),
  reportedLocationRegion: text("reported_location_region"),
  reportedLocationCountry: text("reported_location_country"),
  reportedLocationTimezone: text("reported_location_timezone"),
  locationSource: text("location_source"),
  nightDimEnabled: boolean("night_dim_enabled").notNull().default(true),
  nightDimStart: text("night_dim_start").notNull().default("20:00"),
  nightDimEnd: text("night_dim_end").notNull().default("06:00"),
  nightDimOpacity: doublePrecision("night_dim_opacity").notNull().default(0.35),
  slideshowPaused: boolean("slideshow_paused").notNull().default(false),
  slideshowPauseReason: text("slideshow_pause_reason"),
  slideshowCurrentSlide: text("slideshow_current_slide"),
  slideshowLastSeenAt: timestamp("slideshow_last_seen_at", { withTimezone: true }),
  slideshowLastBootId: text("slideshow_last_boot_id"),
  slideshowCommand: text("slideshow_command"),
  slideshowCommandRevision: integer("slideshow_command_revision").notNull().default(0),
  slideshowAppliedCommandRevision: integer("slideshow_applied_command_revision").notNull().default(0),
  slideshowHoldMusicWhilePlaying: boolean("slideshow_hold_music_while_playing").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("kiosk_device_settings_updated_index").on(table.updatedAt), check("kiosk_device_settings_orientation_check", sql`${table.orientation} is null or ${table.orientation} in ('landscape', 'portrait')`), check("kiosk_device_settings_density_check", sql`${table.density} is null or ${table.density} in ('compact', 'standard', 'large')`), check("kiosk_device_settings_pointer_check", sql`${table.pointer} is null or ${table.pointer} in ('coarse', 'fine', 'unknown')`), check("kiosk_device_settings_clock_format_check", sql`${table.clockFormat} is null or ${table.clockFormat} in ('12h', '24h')`), check("kiosk_device_settings_preview_check", sql`${table.setupPreview} in ('normal', 'fit', 'clock', 'weather', 'calendar')`), check("kiosk_device_settings_ui_scale_check", sql`${table.uiScale} >= 0.9 and ${table.uiScale} <= 1.1`), check("kiosk_device_settings_dim_opacity_check", sql`${table.nightDimOpacity} >= 0 and ${table.nightDimOpacity} <= 1`), check("kiosk_device_settings_pause_reason_check", sql`${table.slideshowPauseReason} is null or ${table.slideshowPauseReason} in ('manual', 'music-playing', 'preview')`), check("kiosk_device_settings_command_check", sql`${table.slideshowCommand} is null or ${table.slideshowCommand} in ('pause', 'resume', 'next', 'previous')`)]);

export const devicePairings = pgTable("device_pairings", {
  id: text("id").primaryKey(),
  deviceCodeHash: text("device_code_hash").notNull(),
  userCode: text("user_code").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  deviceName: text("device_name"),
  deviceType: text("device_type").notNull().default("display"),
  deviceId: text("device_id"),
  bootId: text("boot_id").notNull(),
  lastPolledAt: timestamp("last_polled_at", { withTimezone: true }),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
}, (table) => [uniqueIndex("device_pairings_device_hash_unique").on(table.deviceCodeHash), uniqueIndex("device_pairings_user_code_unique").on(table.userCode), index("device_pairings_status_expires_index").on(table.status, table.expiresAt), index("device_pairings_user_id_index").on(table.userId), check("device_pairings_status_check", sql`${table.status} in ('pending', 'approved', 'expired', 'denied', 'consumed')`)]);

export const deviceSessionHandoffs = pgTable("device_session_handoffs", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull(),
  deviceId: text("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bootId: text("boot_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
}, (table) => [uniqueIndex("device_session_handoffs_token_hash_unique").on(table.tokenHash), index("device_session_handoffs_expiry_index").on(table.expiresAt)]);

export const deviceEnrollmentGrants = pgTable("device_enrollment_grants", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
  challengeHash: text("challenge_hash").notNull(),
  grantHash: text("grant_hash"),
  stagedCredentialHash: text("staged_credential_hash"),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  stagedAt: timestamp("staged_at", { withTimezone: true }),
  finalizedAt: timestamp("finalized_at", { withTimezone: true }),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
}, (table) => [uniqueIndex("device_enrollment_grants_challenge_hash_unique").on(table.challengeHash), uniqueIndex("device_enrollment_grants_grant_hash_unique").on(table.grantHash), index("device_enrollment_grants_device_index").on(table.deviceId), index("device_enrollment_grants_expiry_index").on(table.expiresAt)]);

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  payload: jsonb("payload").notNull(),
  revision: integer("revision").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accountIdentities = pgTable("account_identities", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerSubject: text("provider_subject").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("account_identities_provider_subject_unique").on(table.provider, table.providerSubject), index("account_identities_account_id_index").on(table.accountId), check("account_identities_provider_check", sql`${table.provider} in ('password', 'google', 'microsoft', 'apple')`)]);

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
}, (table) => [uniqueIndex("billing_subscriptions_user_provider_unique").on(table.userId, table.provider), uniqueIndex("billing_subscriptions_customer_unique").on(table.providerCustomerId), uniqueIndex("billing_subscriptions_subscription_unique").on(table.providerSubscriptionId), index("billing_subscriptions_status_index").on(table.status), check("billing_subscriptions_provider_check", sql`${table.provider} = 'stripe'`), check("billing_subscriptions_status_check", sql`${table.status} in ('inactive', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused')`)]);

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
  metadata: jsonb("metadata"),
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

export const schoolSources = pgTable("school_sources", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sourceType: text("source_type").notNull(),
  category: text("category"),
  sourcePurpose: text("source_purpose").notNull().default("unknown"),
  courseId: text("course_id"),
  originalFileName: text("original_file_name"),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  sourceDate: timestamp("source_date", { withTimezone: true }),
  notes: text("notes"),
  extractedText: text("extracted_text"),
  intelligence: jsonb("intelligence"),
  processingStatus: text("processing_status").notNull().default("uploaded"),
  processingVersion: integer("processing_version").notNull().default(1),
  processingError: text("processing_error"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("school_sources_user_id_index").on(table.userId), index("school_sources_status_index").on(table.processingStatus), check("school_sources_type_check", sql`${table.sourceType} in ('upload-pdf', 'upload-text', 'upload-image', 'upload-docx', 'email', 'calendar', 'manual')`), check("school_sources_status_check", sql`${table.processingStatus} in ('uploaded', 'processing', 'ready', 'ready_degraded', 'needs_review', 'failed', 'unsupported')`)]);

export const schoolNotes = pgTable("school_notes", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), courseId: text("course_id"), sourceId: text("source_id").references(() => schoolSources.id, { onDelete: "set null" }), title: text("title").notNull(), content: text("content").notNull(), topics: jsonb("topics").notNull().default(sql`'[]'::jsonb`), classDate: timestamp("class_date", { withTimezone: true }), extractionMethod: text("extraction_method").notNull().default("manual"), provenance: jsonb("provenance"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("school_notes_user_id_index").on(table.userId), index("school_notes_source_id_index").on(table.sourceId)]);

export const schoolFindings = pgTable("school_findings", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), sourceId: text("source_id").notNull().references(() => schoolSources.id, { onDelete: "cascade" }), type: text("type").notNull(), payload: jsonb("payload").notNull(), evidence: text("evidence").notNull(), confidence: doublePrecision("confidence").notNull().default(1), certainty: text("certainty").notNull().default("explicit"), reviewState: text("review_state").notNull().default("pending"), appliedAt: timestamp("applied_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("school_findings_user_id_index").on(table.userId), index("school_findings_source_id_index").on(table.sourceId)]);

export const schoolAssets = pgTable("school_assets", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), sourceId: text("source_id").notNull().references(() => schoolSources.id, { onDelete: "cascade" }), originalFileName: text("original_file_name").notNull(), safeFileName: text("safe_file_name").notNull(), mimeType: text("mime_type").notNull(), size: integer("size").notNull(), storageProvider: text("storage_provider").notNull(), storageKey: text("storage_key").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("school_assets_user_id_index").on(table.userId), uniqueIndex("school_assets_storage_key_unique").on(table.storageProvider, table.storageKey)]);

export const schoolAssignments = pgTable("school_assignments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  courseId: text("course_id"),
  courseName: text("course_name"),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id"),
  externalId: text("external_id"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  availableAt: timestamp("available_at", { withTimezone: true }),
  lockAt: timestamp("lock_at", { withTimezone: true }),
  completionStatus: text("completion_status").notNull().default("unknown"),
  planningStatus: text("planning_status").notNull().default("not_started"),
  priority: text("priority").notNull().default("normal"),
  estimatedMinutes: integer("estimated_minutes"),
  pointsPossible: doublePrecision("points_possible"),
  published: boolean("published"),
  canvasUrl: text("canvas_url"),
  personalNotes: text("personal_notes"),
  provenance: jsonb("provenance"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
}, (table) => [index("school_assignments_user_id_index").on(table.userId), index("school_assignments_due_at_index").on(table.userId, table.dueAt), uniqueIndex("school_assignments_source_identity_unique").on(table.userId, table.sourceType, table.sourceId, table.externalId), check("school_assignments_source_type_check", sql`${table.sourceType} in ('canvas-api', 'canvas-calendar', 'school-source', 'manual')`), check("school_assignments_completion_status_check", sql`${table.completionStatus} in ('upcoming', 'due_soon', 'overdue', 'completed', 'submitted', 'graded', 'missing', 'unknown')`), check("school_assignments_planning_status_check", sql`${table.planningStatus} in ('not_started', 'planned', 'in_progress', 'done')`), check("school_assignments_priority_check", sql`${table.priority} in ('low', 'normal', 'high', 'critical')`)]);

export const schoolEmailProposals = pgTable("school_email_proposals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceId: text("source_id").notNull().references(() => schoolSources.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  connectionId: text("connection_id").notNull(),
  messageId: text("message_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  evidence: text("evidence").notNull(),
  confidence: doublePrecision("confidence").notNull(),
  status: text("status").notNull().default("pending"),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("school_email_proposals_user_id_index").on(table.userId), index("school_email_proposals_source_id_index").on(table.sourceId), check("school_email_proposals_status_check", sql`${table.status} in ('pending', 'approved', 'applied', 'dismissed', 'failed', 'needs_target')`)]);

export const clockAlarms = pgTable("clock_alarms", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  time: text("time").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  repeatWeekdays: integer("repeat_weekdays").array().notNull().default(sql`ARRAY[]::integer[]`),
  snoozeEnabled: boolean("snooze_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("clock_alarms_user_id_index").on(table.userId), uniqueIndex("clock_alarms_user_id_alarm_id_unique").on(table.userId, table.id)]);

export const financeConnections = pgTable("finance_connections", {
  id: text("id").primaryKey().references(() => providerConnections.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  environment: text("environment").notNull(),
  institutionId: text("institution_id"),
  institutionName: text("institution_name"),
  status: text("status").notNull().default("connected"),
  reconnectRequired: boolean("reconnect_required").notNull().default(false),
  lastSuccessfulSyncAt: timestamp("last_successful_sync_at", { withTimezone: true }),
  lastAttemptedSyncAt: timestamp("last_attempted_sync_at", { withTimezone: true }),
  errorCategory: text("error_category"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("finance_connections_user_index").on(table.userId), uniqueIndex("finance_connections_user_provider_institution_unique").on(table.userId, table.provider, table.environment, table.institutionId), check("finance_connections_environment_check", sql`${table.environment} in ('sandbox', 'development', 'production')`), check("finance_connections_status_check", sql`${table.status} in ('connected', 'syncing', 'up_to_date', 'needs_attention', 'reconnect_required', 'provider_unavailable', 'disconnected')`)]);

export const financeExternalAccounts = pgTable("finance_external_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  connectionId: text("connection_id").notNull().references(() => financeConnections.id, { onDelete: "cascade" }),
  providerAccountId: text("provider_account_id").notNull(),
  manualAccountId: text("manual_account_id"),
  name: text("name").notNull(),
  type: text("type").notNull(),
  subtype: text("subtype"),
  mask: text("mask"),
  currency: text("currency").notNull().default("USD"),
  currentBalanceMinor: integer("current_balance_minor"),
  availableBalanceMinor: integer("available_balance_minor"),
  creditLimitMinor: integer("credit_limit_minor"),
  status: text("status").notNull().default("connected"),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("finance_external_accounts_user_index").on(table.userId), index("finance_external_accounts_connection_index").on(table.connectionId), uniqueIndex("finance_external_accounts_provider_id_unique").on(table.connectionId, table.providerAccountId)]);

export const financeExternalTransactions = pgTable("finance_external_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  connectionId: text("connection_id").notNull().references(() => financeConnections.id, { onDelete: "cascade" }),
  externalAccountId: text("external_account_id").notNull().references(() => financeExternalAccounts.id, { onDelete: "cascade" }),
  providerTransactionId: text("provider_transaction_id").notNull(),
  pendingProviderTransactionId: text("pending_provider_transaction_id"),
  postedDate: text("posted_date"),
  authorizedDate: text("authorized_date"),
  description: text("description").notNull(),
  merchant: text("merchant"),
  amountMinor: integer("amount_minor").notNull(),
  direction: text("direction").notNull(),
  status: text("status").notNull(),
  providerCategory: text("provider_category"),
  paymentChannel: text("payment_channel"),
  currency: text("currency").notNull().default("USD"),
  removed: boolean("removed").notNull().default(false),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("finance_external_transactions_user_date_index").on(table.userId, table.postedDate), index("finance_external_transactions_account_date_index").on(table.externalAccountId, table.postedDate), uniqueIndex("finance_external_transactions_provider_id_unique").on(table.connectionId, table.providerTransactionId), check("finance_external_transactions_direction_check", sql`${table.direction} in ('income', 'expense', 'transfer')`), check("finance_external_transactions_status_check", sql`${table.status} in ('pending', 'cleared')`)]);

export const financeSyncState = pgTable("finance_sync_state", {
  connectionId: text("connection_id").primaryKey().references(() => financeConnections.id, { onDelete: "cascade" }),
  cursor: text("cursor"),
  initialSyncComplete: boolean("initial_sync_complete").notNull().default(false),
  historicalSyncComplete: boolean("historical_sync_complete").notNull().default(false),
  lastAttemptedAt: timestamp("last_attempted_at", { withTimezone: true }),
  lastSuccessfulAt: timestamp("last_successful_at", { withTimezone: true }),
  nextAllowedAt: timestamp("next_allowed_at", { withTimezone: true }),
  errorCategory: text("error_category"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const schoolCoursePlanOverrides = pgTable("school_course_plan_overrides", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: text("course_id").notNull(),
  semanticField: text("semantic_field").notNull(),
  targetId: text("target_id").notNull().default("primary"),
  value: jsonb("value").notNull(),
  note: text("note"),
  provenance: text("provenance").notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("school_course_plan_overrides_account_course_index").on(table.accountId, table.courseId), uniqueIndex("school_course_plan_overrides_identity_unique").on(table.accountId, table.courseId, table.semanticField, table.targetId), check("school_course_plan_overrides_provenance_check", sql`${table.provenance} = 'manual'`)]);

export const financeTransactionOverrides = pgTable("finance_transaction_overrides", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  externalTransactionId: text("external_transaction_id").notNull().references(() => financeExternalTransactions.id, { onDelete: "cascade" }),
  categoryId: text("category_id"),
  notes: text("notes"),
  ignored: boolean("ignored").notNull().default(false),
  isSubscription: boolean("is_subscription"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("finance_transaction_overrides_user_index").on(table.userId), uniqueIndex("finance_transaction_overrides_transaction_unique").on(table.userId, table.externalTransactionId)]);

export const financeTransferPairs = pgTable("finance_transfer_pairs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceExternalTransactionId: text("source_external_transaction_id").notNull().references(() => financeExternalTransactions.id, { onDelete: "cascade" }),
  destinationExternalTransactionId: text("destination_external_transaction_id").notNull().references(() => financeExternalTransactions.id, { onDelete: "cascade" }),
  confidence: integer("confidence").notNull(),
  confirmed: boolean("confirmed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("finance_transfer_pairs_user_index").on(table.userId), uniqueIndex("finance_transfer_pairs_source_unique").on(table.sourceExternalTransactionId), uniqueIndex("finance_transfer_pairs_destination_unique").on(table.destinationExternalTransactionId)]);

export const financeSavingsGoals = pgTable("finance_savings_goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetAmountMinor: integer("target_amount_minor").notNull(),
  targetDate: text("target_date"),
  progressMode: text("progress_mode").notNull(),
  linkedAccountId: text("linked_account_id"),
  manualAssignedMinor: integer("manual_assigned_minor").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("finance_savings_goals_user_index").on(table.userId), check("finance_savings_goals_mode_check", sql`${table.progressMode} in ('manual', 'dedicated_account', 'contributions')`)]);

export const financeGoalContributions = pgTable("finance_goal_contributions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  goalId: text("goal_id").notNull().references(() => financeSavingsGoals.id, { onDelete: "cascade" }),
  manualTransactionId: text("manual_transaction_id"),
  externalTransactionId: text("external_transaction_id").references(() => financeExternalTransactions.id, { onDelete: "cascade" }),
  amountMinor: integer("amount_minor").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("finance_goal_contributions_user_index").on(table.userId), index("finance_goal_contributions_goal_index").on(table.goalId), uniqueIndex("finance_goal_contributions_external_unique").on(table.goalId, table.externalTransactionId)]);

export const financeSyncJobs = pgTable("finance_sync_jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  connectionId: text("connection_id").notNull().references(() => financeConnections.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("queued"),
  attempts: integer("attempts").notNull().default(0),
  lastErrorCategory: text("last_error_category"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [index("finance_sync_jobs_user_index").on(table.userId), index("finance_sync_jobs_connection_status_index").on(table.connectionId, table.status), index("finance_sync_jobs_claim_index").on(table.status, table.nextAttemptAt, table.leaseExpiresAt), check("finance_sync_jobs_status_check", sql`${table.status} in ('queued', 'processing', 'retry', 'completed', 'failed', 'cancelled')`)]);

export const financeDuplicateDecisions = pgTable("finance_duplicate_decisions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceExternalTransactionId: text("source_external_transaction_id").notNull().references(() => financeExternalTransactions.id, { onDelete: "cascade" }),
  duplicateExternalTransactionId: text("duplicate_external_transaction_id").notNull().references(() => financeExternalTransactions.id, { onDelete: "cascade" }),
  decision: text("decision").notNull(),
  confidence: integer("confidence").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("finance_duplicate_decisions_user_index").on(table.userId), uniqueIndex("finance_duplicate_decisions_pair_unique").on(table.userId, table.sourceExternalTransactionId, table.duplicateExternalTransactionId), check("finance_duplicate_decisions_decision_check", sql`${table.decision} in ('keep_both', 'treat_duplicate')`)]);

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

export const supportReports = pgTable("support_reports", {
  id: text("id").primaryKey(),
  publicReference: text("public_reference").notNull(),
  accountId: text("account_id").references(() => users.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  module: text("module").notNull(),
  severity: text("severity"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  expectedBehavior: text("expected_behavior"),
  reproductionSteps: text("reproduction_steps"),
  notes: text("notes"),
  status: text("status").notNull().default("submitted"),
  diagnostics: jsonb("diagnostics").notNull().default({}),
  attachmentRef: text("attachment_ref"),
  userVisibleMessage: text("user_visible_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
}, (table) => [uniqueIndex("support_reports_public_reference_unique").on(table.publicReference), index("support_reports_account_index").on(table.accountId), index("support_reports_status_index").on(table.status), check("support_reports_type_check", sql`${table.type} in ('bug', 'feature', 'feedback')`), check("support_reports_module_check", sql`${table.module} in ('Dashboard', 'Sports', 'Garage', 'Finance', 'Calendar', 'Mail', 'Music', 'Context', 'Search', 'Notes', 'Projects', 'Account', 'Settings', 'Billing', 'Other')`), check("support_reports_severity_check", sql`${table.severity} is null or ${table.severity} in ('cosmetic', 'annoying', 'broken', 'unusable')`), check("support_reports_status_check", sql`${table.status} in ('submitted', 'reviewing', 'needs_info', 'fixing', 'fixed', 'closed')`)]);

export const supportReportEvents = pgTable("support_report_events", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull().references(() => supportReports.id, { onDelete: "cascade" }),
  actorAccountId: text("actor_account_id"),
  kind: text("kind").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status"),
  internalNote: text("internal_note"),
  userMessage: text("user_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("support_report_events_report_index").on(table.reportId, table.createdAt), check("support_report_events_kind_check", sql`${table.kind} in ('status', 'note')`)]);
