---
name: rtl-layout
description: Use when building or editing React Native layout/UI components in an RTL (right-to-left) app — e.g. Hebrew/Arabic apps. Provides an RTL utility module and guidelines for directional styles (flexDirection, textAlign, margins, borders, alignment) so mirrored layouts stay consistent. Triggers on tasks like "create a component", "build a screen layout", "fix RTL", "style this view", or any work touching flexDirection/textAlign/margin/padding-left/right in a React Native codebase that uses Hebrew, Arabic, Farsi, or otherwise forces RTL.
---

# RTL Layout Skill (React Native)

This skill encodes the RTL layout conventions for React Native apps that force RTL globally (e.g. Hebrew-only apps). It ships a battle-tested `rtl.ts` utility module and the rules for using it consistently when writing layout or custom UI components.

## When to use this skill

Trigger this skill whenever you are:
- Creating a new screen, View, Text, or reusable component
- Editing existing styles that involve direction (`flexDirection`, `textAlign`, `marginLeft/Right`, `paddingLeft/Right`, `left/right`, corner radii, `alignItems`, `justifyContent`)
- Porting LTR components into an RTL codebase
- Fixing a bug where an element appears on the wrong side, text hugs the wrong edge, or a chat bubble's tail points the wrong way

Do **not** trigger for: non-directional styles (colors, fonts, opacity), backend code, or projects that are strictly LTR.

## Installation (one-time per project)

1. If the project already owns an `rtl.ts` (e.g. `utils/rtl.ts` or `src/utils/rtl.ts`), keep it — do **not** overwrite it with the reference. Only compare it against the helpers used below and add what's missing.
2. If there is none, copy `reference/rtl.ts` from this skill into the project at `utils/rtl.ts` (or wherever the project keeps utility modules — match its conventions).
3. Ensure the project's TypeScript path alias (e.g. `@/utils/rtl` or `@utils/rtl`) resolves. Most Expo/RN projects already have `@/*` configured in `tsconfig.json`.
4. **Enforce RTL at build time via `expo-localization`** (preferred — no reload prompt, works from first launch):
   - Install: `npx expo install expo-localization`
   - In `app.json`, add `expo-localization` to `expo.plugins` with the RTL flags as plugin options (next to `supportedLocales` if you use it):
     ```json
     {
       "expo": {
         "plugins": [
           "expo-router",
           ["expo-localization", { "supportsRTL": true, "forcesRTL": true }]
         ]
       }
     }
     ```
   - The plugin also reads `supportsRTL` / `forcesRTL` from `expo.extra`, but plugin options win (`withExpoLocalization` merges `{ ...config.extra, ...options }`), so keep them in one place.
   - Rebuild the native app (`eas build` or `npx expo prebuild && npx expo run:ios/android`). A JS-only reload is not enough — the flags are baked into the native shell.
   - With this in place, `I18nManager.isRTL` is `true` from launch in dev/EAS builds. In Expo Go (which can't apply native flags) the utility forces `isRTL = true` and mirrors by hand — see Rule 9.
5. `expo-router`'s `LocaleProvider direction` only affects router/navigation UI. It does not mirror your own `View`s and `Text`.

## The rules

### Rule 1 — Never write hardcoded `flexDirection: 'row'`
Always use `rtlFlexDirection.row` from the utility. It lays children out from the reading-start edge in every environment (dev build, Expo Go, LTR).

```ts
// Bad
container: { flexDirection: 'row' }

// Good
import { rtlFlexDirection } from '@/utils/rtl';
container: { flexDirection: rtlFlexDirection.row }
```

### Rule 2 — Text alignment uses `rtlTextAlign.start` / `.end`
Never use `textAlign: 'left'` or `'right'`. Think semantically: "start" = where reading begins (the right edge in RTL), "end" = where reading ends.

```ts
import { rtlTextAlign } from '@/utils/rtl';
label:   { textAlign: rtlTextAlign.start }  // reading-start edge in every environment
trailing:{ textAlign: rtlTextAlign.end }    // reading-end edge in every environment
centered:{ textAlign: rtlTextAlign.center }
```

### Rule 3 — Horizontal cross-axis alignment in columns uses `rtlAlign.start` / `.end`
Use `rtlAlign` **only** for `alignItems` / `alignSelf` in a column container (the default `flexDirection`), where the cross axis is horizontal. The raw value depends on whether React Native already mirrors natively — don't reason about it, reason about the visual result. This is how a chat pins "from me" bubbles to the reading-start edge.

Do **not** use `rtlAlign` for:
- `justifyContent` inside a `rtlFlexDirection.row` row — the row direction already mirrors, so use plain `'flex-start'` / `'flex-end'`. (In Expo Go the row is `row-reverse`; `rtlAlign.start` would return `flex-end` and pack children to the left.)
- Vertical axes — `justifyContent` in a column or `alignItems` in a row. Those aren't directional; `rtlAlign` would flip top/bottom in Expo Go.

```ts
import { rtlAlign } from '@/utils/rtl';
messageFromMe:    { alignItems: rtlAlign.start } // renders on the right in RTL
messageFromOther: { alignItems: rtlAlign.end }   // renders on the left in RTL
```

### Rule 4 — Directional margins/padding use the spread pattern
For single-sided margin/padding, use `rtlMargin.marginStart/marginEnd` or `rtlPadding.paddingStart/paddingEnd` and **spread** the result into the style object.

```ts
import { rtlMargin } from '@/utils/rtl';

backButton: {
  ...rtlMargin.marginEnd(16),   // gap renders on the reading-end side (left in RTL)
  padding: 8,
},
```

For **symmetric** horizontal spacing, keep `marginHorizontal` / `paddingHorizontal` as-is — they're already direction-neutral.

### Rule 5 — Asymmetric corner radii: verify on both platforms
The utility has no corner-radius helper. Physical corners (`borderBottomLeftRadius`, ...) are handled differently per platform under native RTL: Android swaps left/right corners when `doLeftAndRightSwapInRTL` is on (`BorderRadiusStyle.kt`), iOS does not (`CascadedRectangleCorners::resolve` in `primitives.h`). For chat-bubble tails or other asymmetric corners, keep the styles local to the component and check the result on iOS and Android, in both Expo Go and a dev build.

### Rule 6 — Absolute positioning uses `rtlPosition`
When absolutely positioning something at the reading-start edge (visually right in RTL), use `rtlPosition.start(value)`; for the reading-end edge, `rtlPosition.end(value)`.

```ts
import { rtlPosition } from '@/utils/rtl';
badge: { position: 'absolute', top: 4, ...rtlPosition.start(8) } // 8pt from the reading-start edge
```

### Rule 7 — NativeWind / Tailwind classNames do **not** auto-flip
Classes like `ml-4`, `mr-2`, `pl-4`, `pr-4`, `text-left`, `text-right`, `left-0`, `right-0` are physical, not logical — they will **not** flip in RTL. This is a common source of bugs in this codebase.

Fixes:
- Prefer React Native `StyleSheet` with RTL utilities for any directional style.
- If you must stay in NativeWind, use logical equivalents: `ms-4` (margin-start), `me-4` (margin-end), `ps-4`, `pe-4`, `text-start`, `text-end`, `start-0`, `end-0`. Verify your `tailwind.config.js` / NativeWind version supports these before relying on them.
- Non-directional utility classes (`flex-1`, `items-center`, `justify-between`, `gap-2`, `py-4`, `px-4`, `mx-4`, `my-2`) are safe.

### Rule 8 — Icons that imply direction should be mirrored
Back chevrons, arrows, progress indicators: if you import a `ChevronLeft`, in RTL users expect it on the opposite side and pointing the opposite way. Either swap to `ChevronRight` or apply `transform: [{ scaleX: -1 }]`. Do not mirror icons that have intrinsic meaning (checkmarks, logos, media controls like play ▶).

### Rule 9 — Helpers compare product direction with native direction
The utility tracks two directions:
- **Product direction** — `isRTL`. It reads `I18nManager.isRTL`, except in Expo Go, where it is forced to `true` (Expo Go can't apply native RTL flags; detected via `Constants.executionEnvironment === ExecutionEnvironment.StoreClient`).
- **Native direction** — `I18nManager.isRTL`. When it is `true`, React Native already mirrors `flexDirection: 'row'`, `flex-start`/`flex-end`, `textAlign: 'left'/'right'`, and (with `doLeftAndRightSwapInRTL`, the default) margin/padding/position left/right.

Helpers mirror by hand only when the two differ, so they render correctly in dev/EAS builds, Expo Go, and LTR apps. Never mix helpers with hand-picked physical values — a hardcoded `marginRight` renders on the left in a dev build and on the right in Expo Go. Use `getRTLDebugInfo()` to see `isRTL`, `i18nIsRTL`, and `mirror` when debugging.

## Quick decision table

| You want to…                                  | Use                               |
|-----------------------------------------------|-----------------------------------|
| Lay children horizontally                     | `flexDirection: rtlFlexDirection.row` |
| Align text to the reading-start edge          | `textAlign: rtlTextAlign.start`   |
| Push column children to the reading-start edge | `alignItems: rtlAlign.start` (column containers only) |
| Pack row children from the reading-start edge | `flexDirection: rtlFlexDirection.row` + `justifyContent: 'flex-start'` |
| Add margin on the reading-end side            | `...rtlMargin.marginEnd(n)`       |
| Add padding on the reading-start side         | `...rtlPadding.paddingStart(n)`   |
| Absolutely position at the start edge         | `...rtlPosition.start(n)`         |
| Symmetric horizontal spacing                  | `marginHorizontal` / `paddingHorizontal` (no utility needed) |

## Reference component patterns

### Row with icon + text (most common)
```tsx
import { StyleSheet, View, Text } from 'react-native';
import { rtlFlexDirection, rtlTextAlign, rtlMargin } from '@/utils/rtl';

const styles = StyleSheet.create({
  row: {
    flexDirection: rtlFlexDirection.row,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  label: {
    flex: 1,
    textAlign: rtlTextAlign.start,
    fontSize: 16,
  },
  icon: {
    ...rtlMargin.marginEnd(12),
  },
});
```

### Chat bubble (edge alignment)
```tsx
import { rtlAlign } from '@/utils/rtl';

const styles = StyleSheet.create({
  messageFromMe:    { alignItems: rtlAlign.start },
  messageFromOther: { alignItems: rtlAlign.end },
  bubbleFromMe:     { borderRadius: 16, backgroundColor: '#1E40AF' },
  bubbleFromOther:  { borderRadius: 16, backgroundColor: '#FFF' },
});
```

### Header with back button
```tsx
import { rtlFlexDirection, rtlMargin } from '@/utils/rtl';

const styles = StyleSheet.create({
  header: {
    flexDirection: rtlFlexDirection.row,
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
  },
  backButton: {
    ...rtlMargin.marginEnd(16),
  },
});
```

## Checklist before finishing any layout change

- [ ] No hardcoded `flexDirection: 'row'` — use `rtlFlexDirection.row`
- [ ] No `textAlign: 'left' | 'right'` — use `rtlTextAlign.start/end`
- [ ] No `marginLeft/Right`, `paddingLeft/Right`, `left/right` properties in styles — use `rtlMargin`/`rtlPadding`/`rtlPosition` spreads
- [ ] No NativeWind physical-direction classes (`ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right`, `left-*`, `right-*`)
- [ ] Directional icons (chevrons, arrows) mirrored or swapped
- [ ] `expo-localization` plugin enabled in `app.json` with `supportsRTL` and `forcesRTL` both `true` in its plugin options
- [ ] Checked one changed screen in both Expo Go and a dev build (`npx expo run:ios`): the title aligns right, row children start on the right, and a `marginStart` gap appears on the right in both
- [ ] New component's styles grep-clean for `'row'`, `'left'`, `'right'` used as literal style values

## Files bundled with this skill

- `reference/rtl.ts` — the full utility module. Copy into new projects at `utils/rtl.ts` (never over an existing project-owned `rtl.ts`).
