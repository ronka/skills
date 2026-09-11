---
name: add-app-iap
description: Add RevenueCat IAP to an Expo or React Native app using Ronka's patterns for subscriptions, lifetime unlocks, consumable credits, crash-safe delivery, and restoration. Use for mobile IAP, RevenueCat, subscriptions, credit packs, or purchase restore flows.
---

# Add app IAP

Use current RevenueCat guidance for ordinary SDK and dashboard mechanics. This skill governs the architectural choices learned from Startup Tycoon's implementation.

## Start with maintained references

1. Inspect the app's platforms, exact Expo/React Native version, auth, persistence, server, and existing purchase code.
2. Read the matching versioned Expo docs at `https://docs.expo.dev/versions/<installed-sdk>/` and RevenueCat's current [Expo installation](https://www.revenuecat.com/docs/getting-started/installation/expo), [customer identity](https://www.revenuecat.com/docs/customers/identifying-customers), [restoration](https://www.revenuecat.com/docs/getting-started/restoring-purchases), and [non-subscription](https://www.revenuecat.com/docs/platform-resources/non-subscriptions) guides. Follow them instead of restating their setup steps.
3. Look for another installed RevenueCat/IAP reference skill, excluding `add-app-iap`. If found, mention and use it for current vendor mechanics. Otherwise suggest `find-skills`, then continue from official docs without blocking.

## Choose the restore model before coding

| Product | Restore source | App database needed solely for restore? |
| --- | --- | --- |
| Subscription | RevenueCat entitlement | No |
| Non-consumable unlock | RevenueCat/store entitlement | No |
| Consumable credits | Purchases minus consumption | Yes, for reinstall/cross-device restore |

Tell the user that RevenueCat records consumable purchases but not their spent balance. If consumable restore intent is unstated, ask them to choose:

- **Account-backed:** require auth plus an app database; read [account-backed consumables](references/2026-09-10-account-backed-consumables.md).
- **Local-only:** require no database; explicitly state that the balance cannot be promised after reinstall or on another device.

Do not add a database merely for subscription or non-consumable restoration. A backend may still be needed to authorize server features.

## Preserve the Ronka invariants

- Put RevenueCat behind an app-domain purchase facade with a native adapter and typed unavailable fallback for Expo Go, web, tests, and unsupported platforms. Lazy-load newly added native UI modules when an OTA may reach older binaries.
- Configure once with platform-specific public SDK keys. Use a stable app user ID when auth exists, or call `Purchases.logIn()` after later sign-in.
- Keep one typed registry from product ID to benefit. Load localized prices from offerings; unknown products and missing offerings grant nothing.
- Funnel direct purchases, launch recovery, hosted-paywall completion, and restore through one idempotent reconciliation path. Treat a hosted-paywall result as an outcome, then reconcile; do not infer a grant from dismissal alone.
- For local consumables, persist `{ remaining, spent, grantedTransactionIds }`; credit the benefit and record its transaction ID in one state update. This is crash recovery for the current install, not full restore.
- Keep free and purchased pools separate, spend free units first, and preserve purchased balances plus transaction ledgers across “new game” and “reset app.”
- For subscriptions and durable unlocks, gate access only on the configured active entitlement after launch, purchase, restore, login/logout, and customer-info updates.
- Make restore user-triggered and distinguish `restored`, `nothing`, and `error`. “Nothing to restore” is successful for consumables.
- Verify duplicate delivery, interruption between payment and credit, relaunch recovery, repeated restore, missing offerings, cancellation, unsupported platforms, and the selected reinstall/cross-device promise. Use a native development/store sandbox, never a real charge.

Finish with the identifiers, public environment variables, supported restore promise, remaining dashboard work, and human sandbox checks. Respect repository approval rules before native/EAS builds or publishing.
