# Account-backed consumables

Use this model when credits must survive reinstall or move across devices. Authentication is part of restoration; a database alone cannot identify whose balance to restore.

## Startup Tycoon model

- Keep local paid state as `{ remaining, spent, grantedTransactionIds }` and persist a credit plus its transaction ID atomically.
- Store one allowlisted, verified purchase row per account and transaction ID. Derive total granted from those rows; store cumulative spent units separately; compute `remaining = max(0, granted - spent)`.
- Insert transactions idempotently and sync cumulative totals, never deltas. On merge, take monotonic spent totals and union transaction IDs so retries and overlapping passes cannot replay a purchase or spend.
- On first account link, define how local and server balances combine. Startup Tycoon uses the larger remaining balance so linking cannot erase a recent offline purchase; make that user-favoring choice explicit.
- Reconcile store/RevenueCat purchases before pulling server state. Restore then means account sign-in plus reconciliation plus a fresh authoritative balance.
- Preserve paid balances and transaction ledgers across local reset/new-game flows.

## Server boundary

Prefer authenticated RevenueCat `NON_RENEWING_PURCHASE` webhooks or server-side purchase verification. Treat delivery as at-least-once and use a unique provider transaction key. Map product IDs to grant amounts on the server; reject client-supplied prices, quantities, and unknown products.

A minimal data model needs:

- an account linked to the app's stable login identity;
- purchase transactions keyed by provider transaction ID with product ID and granted units;
- cumulative spent units per credit kind;
- authenticated session/account deletion behavior consistent with the app's privacy policy.

If offline spending is supported, test concurrent devices, first-link merging, retry after timeouts, and transaction-ledger union. Otherwise perform spends on the server and return its balance directly.

Use RevenueCat's maintained [webhook](https://www.revenuecat.com/docs/integrations/webhooks), [customer identity](https://www.revenuecat.com/docs/customers/identifying-customers), and [non-subscription](https://www.revenuecat.com/docs/platform-resources/non-subscriptions) documentation for provider mechanics.
