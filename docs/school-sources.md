# Cosmic School Sources

School Sources are owner-only, account-scoped records. The current phase supports pasted/manual text and PDF, TXT, and Markdown uploads.

## Pipeline

`source input → text extraction → normalization → conservative explicit extraction → provenance/conflict detection → SchoolSnapshot → Calendar, Briefing, AI, Search`

Only explicit labeled facts and clearly named events are extracted. Missing uniform information remains unspecified. `TBD`, `TBA`, and similar values remain explicit and produce a review warning. A relative date such as “Thursday” is retained as source evidence but is not converted into a calendar event until a concrete date is present.

## Storage and security

Migration `0026_school_sources` creates private rows keyed by the authenticated account. APIs call the server-side School owner gate and never accept an account ID from the client. Extracted text and bounded intelligence are stored in the database; raw files are not exposed through public URLs and are not currently retained as durable object files. A future object-storage implementation belongs behind `services/school/sources/storage.ts`.

Uploads are limited to 10 MB and accept PDF, TXT, and Markdown. PDF extraction is intentionally conservative and text-only; scanned/image-only PDFs fail with a readable-text error instead of generating guessed data.

## Current limitations

- Structured extraction is deterministic and explicit-only; no AI call is made automatically.
- PDF extraction handles common embedded text literals, not OCR or every PDF encoding.
- Source-derived calendar events require an explicit ISO date and time.
- Source deletion removes the source and its derived intelligence; it does not alter manually entered School data or Canvas connections.
- Run the migration in the normal deployment process before enabling the production source UI.
