# Cosmic+ Stripe billing runbook

Cosmic+ is one recurring plan: **$4.99 USD per month**, with no trial and no annual option. Checkout is server-created from `STRIPE_COSMIC_PLUS_PRICE_ID`; the browser never chooses an arbitrary price or account ID.

## Local Stripe test mode

Use a Stripe test-mode product and recurring monthly price. Test objects are separate from live objects: use a test secret key, test price ID, test customers, and test subscriptions together.

```sh
stripe login
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Copy the `whsec_...` secret printed by `stripe listen` into the local `STRIPE_WEBHOOK_SECRET`. Do not use that CLI secret for the canonical production endpoint. The local environment should contain:

```dotenv
STRIPE_ENVIRONMENT=test
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_COSMIC_PLUS_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use Stripe's documented successful test card `4242 4242 4242 4242`, a future expiration date, any three-digit CVC, and any postal code. Never use real card details in test or documentation.

Manual test sequence:

1. Start the app and Stripe CLI listener.
2. Sign in with a real local Cosmic account and open `/cosmic-plus`.
3. Start Checkout and confirm the server-created session uses the configured $4.99 monthly price.
4. Complete test Checkout, then wait for `checkout.session.completed` and subscription/invoice events. The success redirect alone must not grant access.
5. Confirm `/account` and `/dev/billing` show the subscription, effective Cosmic+ entitlement, customer existence, and the last processed webhook.
6. In the Stripe test Dashboard, exercise renewal/payment-failure behavior where available. Confirm `past_due`/`unpaid` do not become an entitlement when the subscription is no longer payable.
7. Cancel at period end, confirm the UI says access remains through the current period, then resume before the period ends. Confirm a canceled subscription cannot create a duplicate active subscription.
8. Open the billing portal and confirm it returns to `/cosmic-plus`.
9. Repeat with duplicate and out-of-order webhook deliveries; the billing row should converge to the newest event and no duplicate subscription should be created.

## Canonical endpoint and live activation

The production webhook endpoint is:

`https://cosmicpudge.shop/api/billing/webhook`

Before activation, in Stripe live mode:

1. Verify the Stripe account and configure the customer portal settings.
2. Create the live Cosmic+ product and a live recurring USD price of 499 cents per month. Record its live `price_...` ID.
3. Add the canonical webhook endpoint and subscribe at minimum to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`.
4. Copy the endpoint's live `whsec_...` signing secret. It is distinct from the Stripe CLI secret and from test-mode secrets.
5. Configure the production environment only with matching live values:

```dotenv
STRIPE_ENVIRONMENT=live
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_COSMIC_PLUS_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=https://cosmicpudge.shop
```

6. Apply the repository migrations to the production database before enabling billing. Confirm the deployed app points at that same database and that `billing_subscriptions` and `billing_webhook_events` exist.
7. Run one controlled live purchase and verify Checkout, the signed webhook, entitlement, portal, and period-end cancellation end to end. Do not activate live billing until this checklist passes.

Never expose `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` to the browser or prefix them with `NEXT_PUBLIC_`. The price ID and app URL are configuration values, but the server remains authoritative for price selection and account mapping.

## Implementation notes

The webhook reads the raw request body, verifies `stripe-signature`, records event IDs, ignores stale subscription events, and returns a retryable error when processing fails. The entitlement order is development override (non-production only), production admin override, verified billing, then Free. Stripe status values including `incomplete`, `incomplete_expired`, and `paused` are persisted and are not entitled.

The billing table intentionally remains one Stripe record per Cosmic account. The configured Stripe secret, price, customer, subscription, Checkout Session, and webhook endpoint must all belong to the same environment; test and live deployments use separate configuration/database contexts. The application now validates the stored Customer against the currently configured Stripe environment before reuse, so an old test Customer cannot be sent to live Checkout. An explicit environment column is not added because allowing simultaneous test and live Stripe records for one account in the same billing row would create an ambiguous entitlement source; use separate test/live deployment data when both modes must be exercised.

If the billing query fails, the app deliberately fails closed to Free and surfaces the failure through server logs. A successful build does not prove that the deployed database has been migrated; check the target database and deployment environment separately.
