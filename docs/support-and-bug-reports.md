# Support and bug reports

Cosmic support is available at `/support`. Version 1 requires an authenticated account to submit or view reports; this keeps ownership and follow-up unambiguous. Guests can still browse the support entry point and are directed to sign in.

Reports are Bug, Feature request, or General feedback. Bug reports use the shared module list and human severity labels. Each report receives a non-sequential public reference such as `COS-8A31F2C0` and moves through Submitted, Reviewing, Needs Info, Fixing, Fixed, and Closed.

The form shows a collapsible diagnostic preview before submission. Server-built diagnostics are limited to route, version, environment, browser, viewport, signed-in state, account ID, timestamp, active module, safe client error summary, and effective plan. They supplement the user’s description and are never submitted automatically. Redaction removes credential/token/cookie/API-key/database/Stripe patterns and VIN-shaped identifiers from unexpected text. Cosmic never collects passwords, tokens, private app content, Finance, Mail, Calendar, Garage VIN/plate/DTC notes, Notes/files, or provider credentials in this flow.

Attachments are intentionally not implemented. `attachmentRef` remains available for a future controlled upload flow. Email notifications and GitHub synchronization are also future integrations.

Admins use `/admin/reports` to filter reports, inspect the human report and safe diagnostics, change status, and add internal notes. The account email is the primary support reference; the stable account ID is secondary. Needs Info can carry a user-visible message. Status changes and notes are recorded in both the report event history and the existing admin audit log. Users see only their own reports and user-visible messages; internal notes and other accounts are never exposed.

V1 has no distributed rate limiter. The API validates lengths and enums, disables repeat submission after success, and uses account ownership checks. A distributed rate limit and abuse controls are required before broad public launch. Support reports are not included in global Search.
