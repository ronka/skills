# Provider notes and verification matrix

Use this reference while implementing provider adapters and tests. Confirm APIs against the installed versions and current official documentation.

## Polar

Official references:

- Webhook delivery and signatures: <https://polar.sh/docs/integrate/webhooks/delivery>
- Webhook events: <https://polar.sh/docs/integrate/webhooks/events>
- Orders: <https://polar.sh/docs/features/orders>
- Checkout links: <https://polar.sh/docs/features/checkout/links>
- Refunds: <https://polar.sh/docs/features/refunds>
- Sandbox: <https://polar.sh/docs/integrate/sandbox>
- MCP server: <https://polar.sh/docs/integrate/mcp>
- Better Auth adapter: <https://polar.sh/docs/integrate/sdk/adapters/better-auth>

Provision checkout links and webhook endpoints as described in [polar-setup.md](polar-setup.md).

### Signature verification

Endpoints created from 2026-09-08 use Standard Webhooks signatures (`webhook-id`, `webhook-timestamp`, `webhook-signature` headers); pass the `whsec_...` secret unchanged. Older endpoints use Polar's HMAC scheme, reported by `uses_standard_webhook_signature: false`. The TypeScript helper is `validateEvent(body, headers, secret)` from `@polar-sh/sdk/webhooks`, which throws `WebhookVerificationError`; framework adapters (`@polar-sh/nextjs` `Webhooks`, `@polar-sh/better-auth` `webhooks()`) wrap it. Polar states SDKs from 1.0.0-alpha.19 try both schemes; confirm the installed SDK or adapter version verifies the endpoint's scheme. Verify over the exact raw body; parsing and re-serializing JSON breaks signatures.

### Delivery behavior

Polar times out after 10 seconds, retries failures up to 10 times with exponential backoff, treats `3xx` as failure, and disables an endpoint after 10 consecutive failed deliveries. Respond `403` only for verification failure and `2xx` for every verified event.

### `order.paid`

`order.paid` is the fulfillment event; `order.created` may precede payment. It also fires for subscription renewals. The event's `data` is an Order. Before fulfillment require:

- `data.organization_id` equals the configured organization;
- `data.billing_reason === "purchase"`;
- `data.status === "paid"` (or `data.paid === true`);
- `data.product_id` is registered for this environment;
- `data.customer.email` is present (the schema allows null);
- `data.id` as the idempotency key; store `data.checkout_id` for the thank-you page.

Amounts (`total_amount`, `net_amount`, `tax_amount`, `discount_amount`) are integer minor units with `currency`. Use the order's charged amount rather than catalog prices when discounts can apply. Checkout link `metadata` is copied to the order but is merchant-configured routing data, not a source of entitlement decisions.

### `order.refunded`

Fires for full and partial refunds. Check `data.status` (`refunded` or `partially_refunded`) and `refunded_amount`. For one-time products, Polar's default refund revokes Polar-managed benefits; application entitlements must be revoked by the application.

### Better Auth adapter

`@polar-sh/better-auth` can register `webhooks({ secret, onOrderPaid, onOrderRefunded, ... })` at `/api/auth/polar/webhooks`. Its `createCustomerOnSignUp` option syncs Better Auth users to Polar customers; it is not needed for this flow and does not replace email-keyed entitlements. Polar Benefits are also optional; the application's entitlement table is the source of truth.

## Better Auth magic links

Official reference:

- Magic Link plugin: <https://www.better-auth.com/docs/plugins/magic-link>

The plugin supports `callbackURL`, `newUserCallbackURL`, `errorCallbackURL`, `expiresIn`, and `disableSignUp`. Its documented default expiration is 300 seconds. Configure an explicit lifetime and make the email copy match it. The default permits signup; that is what lets a first-time buyer become a user after proving email control.

Use the target project's Better Auth adapter and generated schema. Do not hand-roll verification tokens or session cookies. Confirm the installed Better Auth version's server API for programmatically requesting the initial magic link.

## Resend

Official references:

- Send Email: <https://resend.com/docs/api-reference/emails/send-email>
- Domains: <https://resend.com/docs/dashboard/domains/introduction>
- MCP server: <https://resend.com/docs/mcp-server>

Provision domains, keys, and delivery tests through the MCP server as described in [resend-setup.md](resend-setup.md).

The Node SDK returns `{ data, error }`; handle `error` explicitly. A verified sending domain is required for production recipients. Provide both accurate HTML and usable text content when appropriate. Resend supports idempotency keys, but a retry that generates a different magic-link URL is not the same request; do not use one idempotency key for differing payloads.

## Required tests

### Webhook verification and validation

- valid signature from a real `whsec_...` secret in Standard Webhooks format is accepted; a mocked verifier does not count
- invalid or missing signature returns `403` and writes nothing
- body parsed and re-serialized before verification is caught by the test above
- ignored with `2xx` and no fulfillment: other organization, unregistered product, non-`purchase` billing reason, unhandled event type
- verified order without customer email is acknowledged, not fulfilled, and logged for support

### Fulfillment and refunds

- first delivery creates one purchase, its checkout ID, and all expected entitlements
- duplicate and concurrent delivery create no duplicate access
- normalized email matches mixed-case/whitespace input
- full refund revokes access; partial refund does not unless configured
- refund before or without the original order prevents a later `order.paid` replay from granting access
- sandbox and production IDs come from environment configuration
- if reconciliation is enabled: it fulfills an order the webhook missed, is a no-op for fulfilled orders, and applies the refund rule
- no raw payload or secret is retained or logged

### Email and auth

- webhook responds before the email is sent, and the automatic link request occurs only after durable fulfillment
- Resend returned error is treated as failure
- failed or lost delivery remains recoverable
- both resend paths are rate-limited and enumeration-safe
- first-time buyer becomes a verified Better Auth user on redemption
- existing user receives a new session
- expired/used link follows a useful error path
- callback cannot escape the allowlist

### Authorization and UX

- anonymous request is redirected to login
- verified buyer can access the exact entitled resource
- authenticated non-buyer is denied
- one product does not unlock another
- client-side purchase state cannot bypass the server gate
- thank-you page with an unknown or not-yet-fulfilled `checkout_id` shows a bounded pending state, then recovery, and reveals no email or purchase existence

### End-to-end handoff

- sandbox purchase with the test card verifies webhook, redirect, email receipt, account creation, access, duplicate redelivery, and refund revocation
- production migration order is documented
- production Polar webhook endpoint and checkout link success URLs are configured or handed off
- Resend domain is verified (or its pending DNS records are handed off) and the key is domain-restricted `sending_access`
- a real low-value production purchase verifies the same flow
