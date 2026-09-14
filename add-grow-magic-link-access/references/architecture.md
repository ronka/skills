# Purchase-to-account architecture

Read this before choosing tables, retries, or auth boundaries.

## Identity lifecycle

The provider knows a payer email before the application has a user:

1. Grow reports a successful transaction.
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
- provider transaction ID
- normalized payer email
- paid status and paid timestamp
- charged total and currency when the product needs them
- provider process/payment-link identifier

Unique: `(provider, provider transaction ID)`.

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

Use a unique key such as `(purchase ID, delivery kind)` to coordinate automatic delivery. A simple application may dispatch immediately after commit; a job-capable application should use a transactional outbox. Concurrent claim/update semantics should prevent routine duplicate sends. Because a crash can occur after Resend accepts an email but before the database records success, design notification as at-least-once and keep links single-use and short-lived.

## Webhook transaction boundary

Validate the full notification before writes. Then atomically persist the purchase, all entitlements, and the pending delivery record. Commit before calling Better Auth, Resend, analytics, or provider acknowledgement APIs whose failure should be retried independently.

An existing transaction is a successful idempotent replay. It may resume an unsent delivery, but it must not repeat already-completed business side effects.

For bundles, validate the complete set before the transaction. Partial bundle fulfillment is a data-integrity failure.

## Authentication boundary

Better Auth owns users, verification tokens, sessions, and cookies. Application tables own purchases and entitlements.

Use the Better Auth server API or the project's supported internal boundary to request magic links. Keep a single `sendMagicLink` implementation that delegates delivery to Resend. Check both thrown failures and returned provider errors.

Set `disableSignUp: false` when the magic link must create first-time buyers. On buyer-only sites, protect magic-link issuance with an entitlement lookup rather than changing this setting: disabling signup would prevent the first buyer account from being created.

Callback destinations come from the product registry or an allowlist. Preserve only safe relative paths or explicitly trusted origins.

## Authorization boundary

The protected server route performs both checks on every access:

1. Better Auth session exists and its email is verified.
2. An active entitlement exists for the normalized session email and requested resource.

Optionally claim the entitlement to the Better Auth user ID after the first verified login. Do so transactionally, prevent conflicting claims, and continue preserving the original payer email. Decide explicitly how support handles purchases made with the wrong email or later account-email changes.

## Race and recovery states

Grow's browser redirect and server webhook are independent. The buyer can reach the thank-you or content page before fulfillment commits.

- Treat a short initial miss as pending and retry with a bounded backoff.
- After the bound, show recovery: resend, switch account, contact support, or repurchase as appropriate.
- A fallback resend request gives the same generic response for found and not-found addresses.
- Rate-limit by a combination of IP and normalized email where the stack supports it.

Never grant temporary access merely because the browser arrived from a thank-you URL.
