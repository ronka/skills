# Polar setup through the Polar MCP server

Read this before touching Polar. The goal is resolved product IDs, a webhook endpoint with a Standard Webhooks secret, and checkout links that redirect to the thank-you page, in sandbox first and then production. The agent provisions; the human confirms changes to live resources and does what the MCP server cannot.

## 1. Preflight

Polar runs two separate environments. Each has its own account, organization, products, checkout links, webhook endpoints, secrets, and tokens; nothing carries over.

| Environment | Dashboard | API | MCP server |
| --- | --- | --- | --- |
| Production | `https://polar.sh` | `https://api.polar.sh` | `https://mcp.polar.sh/mcp/polar-mcp` |
| Sandbox | `https://sandbox.polar.sh` | `https://sandbox-api.polar.sh` | `https://mcp.polar.sh/mcp/polar-sandbox` |

Check that the Polar MCP tools for the needed environment are available. The server exposes meta-tools (`search_tools`, `describe_tools`, `execute_tool`); search for the checkout-link and webhook-endpoint operations rather than assuming tool names. If the server is missing, ask the user to add it to their agent's MCP configuration as a streamable HTTP server at the URL above, authenticated with OAuth in the browser, and point to <https://polar.sh/docs/integrate/mcp>. Give server details, not a harness-specific command.

If MCP is unavailable or lacks an operation, fall back to the REST API with an organization access token the user creates with only the scopes needed (`checkout_links:read`, `checkout_links:write`, `webhooks:write`), loaded from the gitignored env file without printing it. If neither is possible, list each step below as a manual dashboard handoff.

## 2. Resolve checkout links

A checkout link URL has the form `https://buy.polar.sh/polar_cl_...`. The path segment is the link's `client_secret`, not its ID. Confirm the environment by the organization that owns the link.

1. **Preferred:** list checkout links (`GET /v1/checkout-links/`) and match the one whose `client_secret` or `url` equals the given link. This returns the link ID needed to update it, its organization, product IDs, and current `success_url`.
2. **Fallback without access:** request the link URL without following redirects. It currently answers `307` to a checkout session URL ending in `polar_c_...`; pass that client secret to the public `GET /v1/checkouts/client/{client_secret}` endpoint for `organization_id`, `products[*].id`, `products[*].is_recurring`, prices, and `success_url`. The redirect is undocumented and each request opens a real checkout session in the merchant's organization, so use it once per link and never at runtime. It does not return the checkout link ID.

Reject any product with `is_recurring: true`; this skill covers one-time products only. Record amounts as Polar's integer minor units (for example `150` with currency `ils` is 1.50 ILS).

## 3. Sandbox counterpart

Production checkout links cannot be paid with test cards. For end-to-end testing, the sandbox organization needs matching one-time products and checkout links. Look for existing ones first; create them only after the user confirms. Put sandbox IDs in the local and preview env files and production IDs in production env configuration.

## 4. Create the webhook endpoint

The endpoint URL must be publicly reachable over HTTPS: a preview or production deployment, or a tunnel to the local dev server for sandbox testing. Polar does not follow redirects, so use the final URL, including the trailing-slash form the framework serves.

If the `@polar-sh/better-auth` plugin registers `webhooks()`, its route is `/api/auth/polar/webhooks`; otherwise use the route built in step 4 of the skill.

Look for an existing endpoint with the same URL first. Then, after the user confirms, create one with:

- `url`: the webhook route;
- `format: "raw"`;
- `events: ["order.paid", "order.refunded"]`;
- `name`: `<app>-<environment>-access`;
- `api_version`: the version the handler's types and fixtures target.

The response contains the signing `secret` (`whsec_...`) and `uses_standard_webhook_signature`. Write the secret straight into the repository's gitignored local env file (verify the ignore rule first), for example as `POLAR_WEBHOOK_SECRET`, without repeating it in messages or summaries. If the variable already has a value, ask before replacing it. Never commit it. For production, set it with the deployment platform's env tooling when available and the user confirms; otherwise list it in the handoff.

If the user chose the reconciliation job, ask them to create a separate organization access token with only the `orders:read` scope for the application, stored like the webhook secret. Do not reuse a provisioning token.

If `uses_standard_webhook_signature` is `false` on an existing endpoint, it uses Polar's older HMAC scheme. Confirm the installed SDK or adapter verifies it, or create a new endpoint.

## 5. Point checkout links at the thank-you page

Only after the thank-you page is deployed at the target origin, and after the user confirms, update each checkout link (`PATCH /v1/checkout-links/{id}`) with:

- `success_url`: `https://<origin>/<thank-you path>?checkout_id={CHECKOUT_ID}`

Polar replaces `{CHECKOUT_ID}` with the checkout session ID, which the webhook reports as the order's `checkout_id`. Show the user the current and new `success_url` before changing a live production link, since buyers are redirected there immediately.

## 6. Prove the flow in sandbox

1. Open the sandbox checkout link and pay with card `4242 4242 4242 4242`, any future expiry, and any CVC. Use an inbox the user named.
2. Confirm the delivery succeeded in the endpoint's delivery log in the Polar dashboard or API, and that the application recorded one purchase, its entitlements, and a delivery record.
3. Confirm the redirect landed on the thank-you page with `checkout_id`, the page resolved from pending to sent, and the access email arrived with a working magic link.
4. Redeliver the same event from Polar and confirm nothing was duplicated.
5. Refund the order fully in the sandbox dashboard and confirm access is revoked.
6. If reconciliation is enabled, make a sandbox purchase with the endpoint temporarily disabled, re-enable it without redelivering, then run the job and confirm it grants access once.

Polar's own emails to customers in sandbox reach only organization members; the application's Resend email is unaffected.

## Report back

Summarize per environment: organization ID, product IDs and their entitlements, webhook endpoint ID, URL, and events (never the secret), env vars written and where, checkout links updated with old and new success URLs, sandbox test result, and what the human still must do.
