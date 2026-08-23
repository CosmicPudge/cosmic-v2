This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Durable account development

Phase J1 uses PostgreSQL through Neon-compatible Drizzle tooling when `DATABASE_URL` is configured:

```bash
cp .env.example .env.local
# set DATABASE_URL to a local or Neon PostgreSQL connection string
npm run db:migrate
npm run dev
```

Use `npm run db:generate` after schema changes. In local development without `DATABASE_URL`, account authentication uses the file-backed `.cosmic/auth-store.json` fallback. Production refuses that fallback and requires `DATABASE_URL`. Never commit `.env.local`, database credentials, password hashes, or session data.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
## Provider connections (J4)

Account-owned Gmail, Spotify, and Calendar credentials require PostgreSQL and `COSMIC_CREDENTIAL_ENCRYPTION_KEY`. Generate a key with `openssl rand -base64 32`, place it only in the deployment environment, and never commit it. Credentials are encrypted with AES-256-GCM before storage. Rotation should add a new key version and re-encrypt existing rows before retiring the old key.

## Web billing (K2)

Web Cosmic+ billing uses Stripe Checkout and Customer Portal. Configure only Stripe test-mode values locally:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_COSMIC_PLUS_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Run `npm run db:migrate` after generating the billing migration. The Stripe CLI is optional; when installed, forward test webhooks with:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Without Stripe variables, Cosmic continues to run, `/cosmic-plus` reports billing unavailable, and the development entitlement simulator remains available. Cosmic stores Stripe identifiers and subscription state only; payment details remain in Stripe.
