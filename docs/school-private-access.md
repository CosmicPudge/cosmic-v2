# Private School access

School is currently an owner-only capability. Configure the server-only
`COSMIC_OWNER_USER_ID` environment variable with the authorized Cosmic account
ID. Do not use a `NEXT_PUBLIC_` name or place the value in browser code.

The central decision is `getSchoolAccess` in
`services/school/access.ts`. When the capability is opened to more accounts,
change that decision there and update the entitlement policy; do not add
identity checks to individual components.
