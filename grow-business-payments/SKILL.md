---
name: grow-business-payments
description: Add Grow Business payment links and purchase webhooks to a website. Use when given a pay.grow.link URL or asked to support Grow products or bundles.
---

# Grow Business payments

Turn a Grow payment link into purchase fulfillment that fits the current site's stack and domain model.

## Workflow

1. Inspect the repository's routes, database, authentication, product access, migrations, and tests. Reuse its conventions.

2. Fetch the payment link and inspect its HTML `__NEXT_DATA__`. Grow currently exposes:

   - `initialState.linkData.paymentLinkId` — the webhook's `paymentLinkProcessId`
   - `initialState.pageData.paymentForm.products[*]` — product IDs, names, prices, and quantity limits

   Keep identifiers as strings. If Grow changes this undocumented page shape, inspect the new payload or ask for the process and product IDs; never derive them from the opaque URL.

3. Add one product registry mapping the discovered process and product IDs to the site's fulfillment actions. Require the exact product set for a fixed bundle. For selectable products, allow only registered IDs and fulfill only purchased items. Ask what a product unlocks only when the repository does not make it clear.

4. Add a webhook using the framework's normal server route. Accept JSON and nested form-encoded bodies. Before fulfillment, require root `status === "1"`, `data.statusCode === "2"`, a registered process ID, registered product IDs and valid quantities, required payer details, and a stable `transactionId` (or `asmachta` fallback). Use `data.sum` as the charged total because line-item prices may be pre-discount.

5. Persist the purchase and all entitlements atomically with a unique provider transaction key. A valid retry must return success without duplicating access, email, analytics, or other side effects. Retain only purchase data the product needs; avoid raw payment/card payloads. Use any Grow verification available to the merchant, and add `ApproveTransaction` after durable persistence when that merchant flow requires it.

6. Test JSON and form parsing, rejected unpaid/unknown/malformed payloads, bundles, first delivery, and duplicate delivery. Run the repository's relevant checks.

7. Return the public HTTPS webhook URL, environment variables, migration/deployment order, and exact Grow-side setup still required. Grow must enable/configure webhooks for existing payment links, and sandbox configuration does not carry into production.

Current Grow references: <https://developers.grow.business/docs/webhooks> and <https://developers.grow.business/reference/approve-transaction-1>.
