# Purchase-to-account architecture

Read this before choosing tables, retries, or auth boundaries.

## Identity lifecycle

The provider knows a customer email before the application has a user:

1. Polar reports a paid one-time order.
2. The application durably records the purchase and email-keyed entitlements.
3. The application requests a magic link and Resend delivers it.
4. The buyer proves control of the email by redeeming the link.
5. Better Auth creates the user when signup is allowed, marks the email verified, creates a session, and redirects to a server-selected callback.
6. Authorization matches the verified session email to an active entitlement.

Account existence is not proof of purchase. A webhook email is not proof that the current browser controls that address. The verified magic link connects those facts.

## Minimal domain model

Adapt names and types to the repository; preserve the constraints.

### Purchase

- provider
- provider order ID
- provider checkout ID
- provider environment when one database can receive both sandbox and production events
- normalized customer email
- status (paid, refunded) and paid/refunded timestamps
- total amount in minor units and currency when the product needs them
- product ID

Unique: `(provider, provider order ID)`. Index the checkout ID for thank-you page lookups.

### Entitlement

- purchase ID
- normalized claimant email
- entitlement/product key
- granted/revoked timestamps or an equivalent active state
- optional claimed user ID after verified login

Unique: a key that prevents the same purchase from granting the same entitlement twice. If the business allows repurchases, do not make email + product globally unique.

### Access-email delivery

- purchase ID
- delivery kind
- state such as pending/sending/sent/failed
- attempt count and timestamps
- provider message ID when available
- sanitized last error

Use a unique key such as `(purchase ID, delivery kind)` to coordinate automatic delivery. Because a crash can occur after Resend accepts an email but before the database records success, design notification as at-least-once and keep links single-use and short-lived.

## Webhook transaction boundary

Verify the signature and validate the full event before writes. Then atomically persist the purchase, all entitlements, and the pending delivery record, and respond. Polar times out requests after ten seconds and recommends answering within two, so the email is dispatched after the response:

- a job-capable application uses a transactional outbox;
- a serverless application uses the framework's post-response hook (`after()`, `waitUntil`) and relies on the thank-you page and resend paths to recover a lost dispatch;
- a pending delivery left by a crash can be resumed by a scheduled sweep or the next replay.

An existing order is a successful idempotent replay. It may resume an unsent delivery, but it must not repeat already-completed business side effects.

A verified event that is irrelevant (another organization, an unregistered product, a non-purchase billing reason, an unhandled event type) is acknowledged with `2xx` and not persisted beyond a redacted log line. A verified, relevant order that cannot be fulfilled, such as one without a customer email, is also acknowledged and logged for support; retrying it will not add the missing data.

## Endpoint health and reconciliation

A long outage (database down, broken deploy, expired secret) can make ten consecutive deliveries fail. Polar then disables the endpoint and emails organization members, and no purchase is fulfilled until someone acts. Recovery is: fix the cause, re-enable the endpoint, and redeliver the failed events from the endpoint's delivery log. Idempotency makes redelivery safe.

When missed purchases are costly, add an optional reconciliation job:

- run on a schedule the product tolerates (for example hourly);
- list recent paid orders for the registered products with an organization access token scoped only to `orders:read`;
- pass each through the same validation and fulfillment function the webhook uses, so an already-fulfilled order is a no-op;
- report how many orders it fulfilled; any non-zero count means webhooks are being missed and the endpoint should be checked.

Reconciliation also closes the gap where a refund arrived while the endpoint was disabled, if it applies the same refund rule to refunded orders.

## Refund boundary

`order.refunded` fires for full and partial refunds. By default, a full refund (`status === "refunded"`) revokes the purchase's entitlements in one transaction and a partial refund changes nothing. Polar may refund automatically to prevent chargebacks, so this path runs in practice. Revocation is idempotent and does not delete the purchase or its email.

A refund event can arrive before or without the application having processed the original order. Record it so a late `order.paid` replay cannot re-grant refunded access.

## Authentication boundary

Better Auth owns users, verification tokens, sessions, and cookies. Application tables own purchases and entitlements. Polar owns payments and customers; the `@polar-sh/better-auth` plugin's customer syncing is optional and independent of this flow.

Use the Better Auth server API or the project's supported internal boundary to request magic links. Keep a single `sendMagicLink` implementation that delegates delivery to Resend. Check both thrown failures and returned provider errors.

Set `disableSignUp: false` when the magic link must create first-time buyers. On buyer-only sites, protect magic-link issuance with an entitlement lookup rather than changing this setting: disabling signup would prevent the first buyer account from being created.

Callback destinations come from the product registry or an allowlist. Preserve only safe relative paths or explicitly trusted origins.

## Authorization boundary

The protected server route performs both checks on every access:

1. Better Auth session exists and its email is verified.
2. An active entitlement exists for the normalized session email and requested resource.

Optionally claim the entitlement to the Better Auth user ID after the first verified login. Do so transactionally, prevent conflicting claims, and continue preserving the original customer email. Decide explicitly how support handles purchases made with the wrong email or later account-email changes.

## Thank-you page and race states

Polar's browser redirect and server webhook are independent. The buyer usually reaches the thank-you page before fulfillment commits.

- Look up the purchase by the `checkout_id` query parameter in the local database. No Polar API call or token is needed.
- Treat a miss as pending and poll or retry with a bounded backoff.
- Once found, show the delivery state and a masked email, and offer a resend for that purchase.
- After the bound, show recovery: resend by email, contact support.
- Both resend paths return the same generic response whether or not a purchase exists, and are rate-limited by IP plus checkout ID or normalized email.

Never grant access, create a session, or reveal the full email merely because the browser holds a checkout ID.
