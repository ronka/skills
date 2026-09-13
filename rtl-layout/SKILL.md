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

1. Check if the project already has `utils/rtl.ts`. If yes, skip to "Usage".
2. If not, copy `reference/rtl.ts` from this skill into the project at `utils/rtl.ts` (or wherever the project keeps utility modules — match its conventions).
3. Ensure the project's TypeScript path alias (e.g. `@/utils/rtl` or `@utils/rtl`) resolves. Most Expo/RN projects already have `@/*` configured in `tsconfig.json`.
4. **Enforce RTL at build time via `expo-localization`** (preferred — no reload prompt, works from first launch):
   - Install: `npx expo install expo-localization`
   - In `app.json`, add `"expo-localization"` to `expo.plugins` and the two flags under `expo.extra`:
     ```json
     {
       "expo": {
         "plugins": ["expo-router", "expo-localization", "..."],
         "extra": {
           "supportsRTL": true,
           "forcesRTL": true
         }
       }
     }
     ```
   - Rebuild the native app (`eas build` or `npx expo prebuild && npx expo run:ios/android`). A JS-only reload is not enough — the flags are baked into the native shell.
   - With this in place, `I18nManager.isRTL` is `true` from launch and `utils/rtl.ts`'s `isRTL` (which reads `I18nManager.isRTL`) resolves correctly.
5. **Fallback only** — if you cannot rebuild natively, you can call `initializeRTL()` once on mount in the root layout (`app/_layout.tsx`). It calls `I18nManager.forceRTL(true)` and prompts a reload on first install. The build-time approach above is strictly better and should be used in new projects.

## The rules

### Rule 1 — Never write hardcoded `flexDirection: 'row'`
Always use `rtlFlexDirection.row` from the utility. This keeps row layouts flipping correctly if LTR is ever enabled.

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
label:   { textAlign: rtlTextAlign.start }  // hugs the right in RTL
trailing:{ textAlign: rtlTextAlign.end }    // hugs the left in RTL
centered:{ textAlign: rtlTextAlign.center }
```

### Rule 3 — Flex alignment uses `rtlAlign.start` / `.end`
For `alignItems` / `justifyContent` when you mean "push to the starting edge", use `rtlAlign`. It resolves to `flex-end` in RTL and `flex-start` in LTR. This is how MessageBubble pins "from me" bubbles to the right edge in an RTL chat.

```ts
import { rtlAlign } from '@/utils/rtl';
messageFromMe:    { alignItems: rtlAlign.start } // right edge in RTL
messageFromOther: { alignItems: rtlAlign.end }   // left edge in RTL
```

### Rule 4 — Directional margins/padding use the spread pattern
For single-sided margin/padding, use `rtlMargin.marginStart/marginEnd` or `rtlPadding.paddingStart/paddingEnd` and **spread** the result into the style object.

```ts
import { rtlMargin } from '@/utils/rtl';

backButton: {
  ...rtlMargin.marginEnd(16),   // expands to { marginLeft: 16 } in RTL
  padding: 8,
},
```

For **symmetric** horizontal spacing, keep `marginHorizontal` / `paddingHorizontal` as-is — they're already direction-neutral.

### Rule 5 — Asymmetric corner radii use `rtlBorderRadius`
For chat bubbles or any element with differing left/right corners. The utility exposes `fromMe` and `fromOther` presets; if you need custom asymmetric corners, follow the same spread pattern and flip via the `isRTL` flag.

```ts
import { rtlBorderRadius } from '@/utils/rtl';
bubbleFromMe:    { ...rtlBorderRadius.fromMe }
bubbleFromOther: { ...rtlBorderRadius.fromOther }
```

### Rule 6 — Absolute positioning uses `rtlPosition`
When absolutely positioning something "to the start" (visually right in RTL), use `rtlPosition.left(value)` — it maps to the correct physical edge.

```ts
import { rtlPosition } from '@/utils/rtl';
badge: { position: 'absolute', top: 4, ...rtlPosition.left(8) }
```

### Rule 7 — NativeWind / Tailwind classNames do **not** auto-flip
Classes like `ml-4`, `mr-2`, `pl-4`, `pr-4`, `text-left`, `text-right`, `left-0`, `right-0` are physical, not logical — they will **not** flip in RTL. This is a common source of bugs in this codebase.

Fixes:
- Prefer React Native `StyleSheet` with RTL utilities for any directional style.
- If you must stay in NativeWind, use logical equivalents: `ms-4` (margin-start), `me-4` (margin-end), `ps-4`, `pe-4`, `text-start`, `text-end`, `start-0`, `end-0`. Verify your `tailwind.config.js` / NativeWind version supports these before relying on them.
- Non-directional utility classes (`flex-1`, `items-center`, `justify-between`, `gap-2`, `py-4`, `px-4`, `mx-4`, `my-2`) are safe.

### Rule 8 — Icons that imply direction should be mirrored
Back chevrons, arrows, progress indicators: if you import a `ChevronLeft`, in RTL users expect it on the opposite side and pointing the opposite way. Either swap to `ChevronRight` or apply `transform: [{ scaleX: -1 }]`. Do not mirror icons that have intrinsic meaning (checkmarks, logos, media controls like play ▶).

### Rule 9 — `isRTL` derives from `I18nManager.isRTL` (except in Expo Go)
`isRTL` in the utility reads `I18nManager.isRTL` directly, so the helpers track the native layout direction. If RTL is enforced at build time via `expo-localization` (`extra.forcesRTL: true`), this resolves to `true` from launch. If you see helpers returning LTR values on device, the native flag isn't set — verify the build, not the JS. Use `getRTLDebugInfo()` to confirm `i18nIsRTL === true` when debugging.

Expo Go can't apply `I18nManager.forceRTL` — it requires a native rebuild — so `I18nManager.isRTL` stays `false` there even in an RTL-only app. The utility detects Expo Go via `expo-constants` (`Constants.executionEnvironment === ExecutionEnvironment.StoreClient`) and hardcodes `isRTL = true` in that case instead of trusting `I18nManager`.

## Quick decision table

| You want to…                                  | Use                               |
|-----------------------------------------------|-----------------------------------|
| Lay children horizontally                     | `flexDirection: rtlFlexDirection.row` |
| Align text to the reading-start edge          | `textAlign: rtlTextAlign.start`   |
| Push flex children to the reading-start edge  | `alignItems: rtlAlign.start`      |
| Add margin on the reading-end side            | `...rtlMargin.marginEnd(n)`       |
| Add padding on the reading-start side         | `...rtlPadding.paddingStart(n)`   |
| Round the bottom-outer corner of a chat bubble| `rtlBorderRadius.fromMe/fromOther`|
| Absolutely position at the start edge         | `...rtlPosition.left(n)`          |
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

### Chat bubble (asymmetric corners + edge alignment)
```tsx
import { rtlAlign, rtlBorderRadius } from '@/utils/rtl';

const styles = StyleSheet.create({
  messageFromMe:    { alignItems: rtlAlign.start },
  messageFromOther: { alignItems: rtlAlign.end },
  bubbleFromMe:     { ...rtlBorderRadius.fromMe, backgroundColor: '#1E40AF' },
  bubbleFromOther:  { ...rtlBorderRadius.fromOther, backgroundColor: '#FFF' },
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
- [ ] `expo-localization` plugin enabled in `app.json` with `extra.supportsRTL` and `extra.forcesRTL` both `true` (or, fallback, `initializeRTL()` called once in the root layout)
- [ ] New component's styles grep-clean for `'row'`, `'left'`, `'right'` used as literal style values

## Files bundled with this skill

- `reference/rtl.ts` — the full utility module. Copy into new projects at `utils/rtl.ts`.
