# Private School access

School is currently an owner-only capability. Configure the server-only
`COSMIC_OWNER_USER_ID` environment variable with the authorized Cosmic account
ID. Do not use a `NEXT_PUBLIC_` name or place the value in browser code.

The central decision is `getSchoolAccess` in
`services/school/access.ts`. When the capability is opened to more accounts,
change that decision there and update the entitlement policy; do not add
identity checks to individual components.

## Canvas Academic API availability

Canvas Calendar/iCal is the currently usable Canvas integration. The optional
Canvas Academic API provider remains available for institution-approved access
and future OAuth/LTI integration. It never requests a USU username, password,
A-number, or SSO credential.

USU Canvas has been manually verified to restrict self-service token creation:

> Your Canvas administrators have chosen to limit your ability to generate
> your own access token. Please reach out to your Canvas administrators to have
> them generate an access token on your behalf.

When no academic token is configured, School remains healthy and the UI labels
the optional connection **Institution access required**. Migrations `0029` and
`0030` remain useful for the provider's normalized Canvas fields and safe course
metadata when institution-approved access becomes available.

## Outlook and manual School Email Import

Direct Outlook/Microsoft 365 mail access uses the server-side Microsoft Graph
adapter and read-only `Mail.Read` permission. Institution-managed accounts may
require an approved Microsoft application, so an unconfigured Outlook OAuth
flow is shown as **Institution authorization required**, not as a provider
failure. Cosmic never requests Microsoft passwords, automates SSO, or imports
Outlook cookies.

The current fallback is **Manual Email Import** under School Updates. Pasted
mail is bounded, normalized into the same `SchoolEmailMessage` pipeline, and
classified before any proposal is created. Relevant proposals remain pending
until approval; irrelevant mail is discarded. Future approved OAuth or inbound
forwarding can use the same normalized adapter boundary without creating a
second School intelligence pipeline.
