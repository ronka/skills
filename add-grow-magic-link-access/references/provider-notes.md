# Provider notes and verification matrix

Use this reference while implementing provider adapters and tests. Confirm APIs against the installed versions and current official documentation.

## Grow Business

Official references:

- Webhooks: <https://developers.grow.business/docs/webhooks>
- Approve Transaction: <https://developers.grow.business/reference/approve-transaction-1>

For the documented regular PaymentLinks webhook, successful examples use root `status === "1"` and `data.statusCode === "2"`. Confirm the merchant's enabled Grow flow before treating those fields as universal. Grow webhook setup may require support involvement, and some flows require an Approve Transaction call after durable persistence. Failure to acknowledge may cause retries, so idempotency remains mandatory.

Use `transactionId`, with `asmachta` only as a documented and stable fallback for the merchant's payload. Require one before fulfillment. Keep `paymentLinkProcessId` and product IDs as strings. Use the transaction-level charged sum rather than summing catalog/list prices when discounts can apply.

If product identifiers must be discovered from a `pay.grow.link` page, use the companion `grow-business-payments` skill when available. Grow page internals are undocumented discovery aids, not runtime APIs.

## Better Auth magic links

Official reference:

- Magic Link plugin: <https://www.better-auth.com/docs/plugins/magic-link>

The plugin supports `callbackURL`, `newUserCallbackURL`, `errorCallbackURL`, `expiresIn`, and `disableSignUp`. Its documented default expiration is 300 seconds. Configure an explicit lifetime and make the email copy match it. The default permits signup; that is what lets a first-time buyer become a user after proving email control.

Use the target project's Better Auth adapter and generated schema. Do not hand-roll verification tokens or session cookies. Confirm the installed Better Auth version's server API for programmatically requesting the initial magic link.

## Resend

Official references:

- Send Email: <https://resend.com/docs/api-reference/emails/send-email>
- Domains: <https://resend.com/docs/dashboard/domains/introduction>

The Node SDK returns `{ data, error }`; handle `error` explicitly. A verified sending domain is required for production recipients. Provide both accurate HTML and usable text content when appropriate. Resend supports idempotency keys, but a retry that generates a different magic-link URL is not the same request; do not use one idempotency key for differing payloads.

## Required tests

### Webhook validation

- accepted JSON and form-encoded successful notification
- rejected failed/unpaid status
- rejected unknown process or product
- rejected missing email or stable transaction ID
- rejected unexpected bundle contents or quantities
- verification/authentication failure

### Fulfillment

- first delivery creates one purchase and all expected entitlements
- duplicate and concurrent delivery create no duplicate access
- bundle persistence is atomic
- normalized email matches mixed-case/whitespace input
- no sensitive raw payload is retained or logged

### Email and auth

- automatic link request occurs only after durable fulfillment
- Resend returned error is treated as failure
- failed delivery remains recoverable
- fallback resend is rate-limited and enumeration-safe
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
- early browser redirect receives a bounded pending state and eventually resolves

### End-to-end handoff

- production migration order is documented
- Grow webhook and success URL configuration is documented
- Resend domain and environment setup are documented
- a real low-value purchase verifies webhook, email receipt, account creation, redirect, and access
