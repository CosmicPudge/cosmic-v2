# Cosmic Admin Console

The Admin Console is a production account-administration surface. It is not a private-content browser and cannot read Mail, Calendar, Finance, Notes, Garage records, VINs, or provider secrets.

## Authorization

Administrator access is stored in PostgreSQL `account_roles` as `(account_id, role = 'admin')`. Every Admin API independently resolves the authenticated session and checks that role server-side. Client state, query parameters, email addresses, and development entitlement overrides never grant access.

The protected pages are `/admin` and `/admin/audit`. Non-admin page requests redirect to `/account`; non-admin API requests return 403 without account-enumeration details.

## Initial bootstrap

After the database migration has been applied and the owner account exists:

```bash
COSMIC_ADMIN_ACCOUNT_ID=user_existing_id npm run db:bootstrap-admin
```

The script requires `DATABASE_URL` and `COSMIC_ADMIN_ACCOUNT_ID`, verifies that the account exists, and inserts the admin role idempotently. Do not expose this as a public route. Remove the shell variable after use.

## Entitlements

Production admin overrides are stored in `admin_entitlement_overrides` and are separate from Stripe billing and development overrides.

- Force Cosmic+ grants complimentary access without creating a Stripe subscription.
- Force Free changes product access but does not cancel Stripe.
- Use billing/default removes the production override.
- Optional expiration is stored server-side.

## Access moderation

- Kick revokes all sessions; the account may sign in again.
- Suspend blocks sign-in until a server-side expiration and revokes sessions.
- Ban blocks sign-in indefinitely and revokes sessions.
- Unban removes the active moderation record.
- Delete requires `DELETE <email>`, cancels an active Stripe subscription first, then deletes the account-owned records through existing cascades.

Moderation reasons and internal notes are administrator-only. Suspension/ban never silently cancels Stripe.

## Audit log

Entitlement changes, session revocation, suspension, ban, unban, and deletion are recorded in `admin_audit_log`. Audit records keep stable actor/target IDs and safe metadata; they do not retain passwords, session tokens, OAuth credentials, Stripe secrets, or private content. Target IDs may remain after account deletion for security history.

## Security

Admin mutations validate the request Origin/Host against `NEXT_PUBLIC_APP_URL`. Production needs a shared distributed rate limiter and provider-level alerting before public launch; this phase does not claim that an in-memory limiter is sufficient for serverless deployment.

## Manual test procedure

1. Apply the generated migration with the normal deployment migration process.
2. Bootstrap a local owner admin with `npm run db:bootstrap-admin`.
3. Confirm a normal account is redirected from `/admin` and receives 403 from Admin APIs.
4. Search an account by partial email and stable account ID.
5. Test Force Cosmic+, Force Free, and Use billing/default; verify Stripe is unchanged.
6. Kick sessions and verify the old cookie no longer authenticates.
7. Suspend with a future expiration, verify sign-in is blocked, then test expiry.
8. Ban, unban, and verify data is preserved.
9. Delete a test account with an active Stripe subscription only in a controlled billing test environment.
10. Review `/admin/audit` and confirm no secret/private-content data is logged.
